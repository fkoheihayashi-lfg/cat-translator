import { Audio } from 'expo-av';
import { CatProfile } from '../context/CatContext';
import { AppLanguage } from '../i18n/strings';
import { analyzeCatAudio, CatInterpretation } from './analyzeCatAudio';
import {
  generateCatReply,
  GenerateCatReplyInput,
  CatReply,
} from './generateCatReply';
import { NewLogEntry, buildCatToHumanLogEntry, buildHumanToCatLogEntry } from './logEntries';
import { persistRecordingFile } from '../utils/recordingStorage';
import { playSound } from '../utils/playSound';
import { CatPersonaState, LogEntryLike } from './catPersona';

type AddLog = (entry: NewLogEntry) => void;

function createAbortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function waitMs(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      clearTimeout(timeoutId);
      reject(createAbortError());
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

export type RunHumanToCatTextTransactionOptions = {
  text: string;
  language: AppLanguage;
  profile: CatProfile;
  personaState: CatPersonaState;
  log: LogEntryLike[];
  addLog: AddLog;
  dismissKeyboard?: () => void;
  onStart?: () => void;
  onReply?: (reply: CatReply, normalizedText: string) => void;
  onComplete?: () => void;
};

export async function runHumanToCatTextTransaction({
  text,
  language,
  profile,
  personaState,
  log,
  addLog,
  dismissKeyboard,
  onStart,
  onReply,
  onComplete,
}: RunHumanToCatTextTransactionOptions): Promise<CatReply | null> {
  const normalizedText = text.trim();
  if (!normalizedText) return null;

  dismissKeyboard?.();
  onStart?.();

  try {
    const replyInput: GenerateCatReplyInput = {
      text: normalizedText,
      language,
      profile,
      personaState,
      log,
    };
    const reply = await generateCatReply(replyInput);
    addLog(buildHumanToCatLogEntry(reply));
    onReply?.(reply, normalizedText);
    await playSound(reply.soundKey);
    return reply;
  } finally {
    onComplete?.();
  }
}

export type StartCatRecordingOptions = {
  onPermissionDenied?: () => void;
  onPermissionGranted?: () => void;
};

export async function startCatRecordingSession({
  onPermissionDenied,
  onPermissionGranted,
}: StartCatRecordingOptions = {}): Promise<Audio.Recording | null> {
  const { granted } = await Audio.requestPermissionsAsync();

  if (!granted) {
    onPermissionDenied?.();
    return null;
  }

  onPermissionGranted?.();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  return recording;
}

export type RunCatAudioAnalysisTransactionOptions = {
  recording: Audio.Recording | null;
  language: AppLanguage;
  profile: CatProfile;
  personaState: CatPersonaState;
  addLog: AddLog;
  delayMs?: number;
  signal?: AbortSignal;
  onStartAnalysis?: () => void;
  onInterpretation?: (interpretation: CatInterpretation, recordingUri?: string) => void;
  onComplete?: () => void;
};

export async function runCatAudioAnalysisTransaction({
  recording,
  language,
  profile,
  personaState,
  addLog,
  delayMs = 1500,
  signal,
  onStartAnalysis,
  onInterpretation,
  onComplete,
}: RunCatAudioAnalysisTransactionOptions): Promise<CatInterpretation | null> {
  const tempRecordingUri = recording?.getURI() ?? undefined;

  try {
    await recording?.stopAndUnloadAsync();
    // Persist first so replay and any server upload both use the same source-of-truth URI.
    const recordingUri = await persistRecordingFile(tempRecordingUri);
    onStartAnalysis?.();
    await waitMs(delayMs, signal);

    const interpretation = await analyzeCatAudio({
      recordingUri,
      language,
      profile,
      personaState,
    });

    addLog(buildCatToHumanLogEntry(interpretation, recordingUri));
    onInterpretation?.(interpretation, recordingUri);
    await playSound(interpretation.soundKey);
    return interpretation;
  } finally {
    onComplete?.();
  }
}

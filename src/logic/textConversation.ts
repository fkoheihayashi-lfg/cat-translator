import { Audio } from 'expo-av';
import { CatProfile } from '../context/CatContext';
import { AppLanguage } from '../i18n/strings';
import { analyzeCatAudio, CatInterpretation } from './analyzeCatAudio';
import {
  generateCatReply,
  GenerateCatReplyInput,
  CatReply,
} from './generateCatReply';
import { getHumanToCatIntentLabel, HumanToCatIntentId } from './humanToCatIntents';
import { NewLogEntry, buildCatToHumanLogEntry, buildHumanToCatLogEntry } from './logEntries';
import { persistRecordingFile } from '../utils/recordingStorage';
import { playSound, playSoundFromUri } from '../utils/playSound';
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
    addLog(buildHumanToCatLogEntry(reply, { type: 'text', userText: normalizedText }));
    onReply?.(reply, normalizedText);
    await playSound(reply.soundKey);
    return reply;
  } finally {
    onComplete?.();
  }
}

export type RunHumanToCatIntentTransactionOptions = {
  intentId: HumanToCatIntentId;
  language: AppLanguage;
  profile: CatProfile;
  personaState: CatPersonaState;
  log: LogEntryLike[];
  addLog: AddLog;
  onStart?: () => void;
  onReply?: (reply: CatReply, intentId: HumanToCatIntentId) => void;
  onComplete?: () => void;
};

export async function runHumanToCatIntentTransaction({
  intentId,
  language,
  profile,
  personaState,
  log,
  addLog,
  onStart,
  onReply,
  onComplete,
}: RunHumanToCatIntentTransactionOptions): Promise<CatReply | null> {
  onStart?.();

  try {
    const replyInput: GenerateCatReplyInput = {
      text: intentId,
      intentId,
      language,
      profile,
      personaState,
      log,
    };
    const reply = await generateCatReply(replyInput);
    addLog(
      buildHumanToCatLogEntry(reply, {
        type: 'intent',
        intentId,
        displayLabel: getHumanToCatIntentLabel(intentId, language),
      })
    );
    onReply?.(reply, intentId);
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

async function restorePlaybackAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  }).catch(() => {});
}

export type RunCatAudioAnalysisTransactionOptions = {
  recording: Audio.Recording | null;
  language: AppLanguage;
  profile: CatProfile;
  personaState: CatPersonaState;
  log?: LogEntryLike[];
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
  log = [],
  addLog,
  delayMs = 1500,
  signal,
  onStartAnalysis,
  onInterpretation,
  onComplete,
}: RunCatAudioAnalysisTransactionOptions): Promise<CatInterpretation | null> {
  if (!recording) return null;

  const tempRecordingUri = recording.getURI() ?? undefined;
  let durationMs = 0;

  try {
    const preStopStatus = await recording.getStatusAsync();
    if (typeof preStopStatus.durationMillis === 'number') {
      durationMs = preStopStatus.durationMillis;
    }

    await recording.stopAndUnloadAsync();
    await restorePlaybackAudioMode();

    const finalStatus = await recording.getStatusAsync();
    if (
      durationMs <= 0 &&
      typeof finalStatus.durationMillis === 'number'
    ) {
      durationMs = finalStatus.durationMillis;
    }

    const recordingUri = await persistRecordingFile(tempRecordingUri);
    if (!recordingUri && tempRecordingUri) {
      // Keep analysis usable even if durable copy fails on a device.
      durationMs = Math.max(durationMs, 0);
    }
    if (finalStatus && finalStatus.canRecord === false && typeof finalStatus.durationMillis === 'number') {
      durationMs = finalStatus.durationMillis;
    }
    onStartAnalysis?.();
    await waitMs(delayMs, signal);

    const interpretation = await analyzeCatAudio({
      recordingUri,
      durationMs,
      language,
      profile,
      personaState,
      log,
    });

    addLog(buildCatToHumanLogEntry(interpretation, recordingUri));
    onInterpretation?.(interpretation, recordingUri);
    if (recordingUri) {
      await playSoundFromUri(recordingUri);
    }
    return interpretation;
  } finally {
    await restorePlaybackAudioMode();
    onComplete?.();
  }
}

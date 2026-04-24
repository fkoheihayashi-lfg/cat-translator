import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import CatAvatar from '../components/CatAvatar';
import { useCat } from '../context/CatContext';
import {
  getConfidenceBandLabel,
  getIntentLabel,
  getStrings,
} from '../i18n/strings';
import {
  CatInterpretation,
  getAvatarMoodFromInterpretation,
  getLocalAnalysisDebugLabel,
} from '../logic/analyzeCatAudio';
import {
  runCatAudioAnalysisTransaction,
  startCatRecordingSession,
} from '../logic/textConversation';
import { playLoggedCatSound } from '../utils/playSound';
import type { ConfidenceBand, IntentBucket } from '../audio/localAnalysis/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Translate'>;
};

type AppState = 'idle' | 'analyzing' | 'result';
type RecordingState = 'idle' | 'recording';

const BAR_DURATIONS = [280, 340, 220, 380, 260];
const ANALYZING_HINT_INTERVAL_MS = 1100;

// Retro glyph per intent — visual only, not translated
const INTENT_GLYPH: Record<IntentBucket, string> = {
  attention_like: '◐',
  food_like: '◓',
  playful: '◈',
  curious: '◇',
  unsettled: '◌',
  sleepy: '☾',
  unknown: '◯',
};

// Muted per-intent accent for the glyph in the chip
const INTENT_CHIP_COLOR: Record<IntentBucket, string> = {
  attention_like: '#b06890',
  food_like: '#9a8050',
  playful: '#8868a0',
  curious: '#5888a8',
  unsettled: '#986848',
  sleepy: '#7060a0',
  unknown: '#5c5c80',
};

// Moon phase chars for confidence — not a meter
const CONFIDENCE_GLYPH: Record<ConfidenceBand, string> = {
  low: '○',
  medium: '◑',
  high: '◕',
};

export default function TranslateScreen({ navigation }: Props) {
  const { profile, language, personaState, log, addLog } = useCat();
  const strings = getStrings(language);
  const [appState, setAppState]             = useState<AppState>('idle');
  const [result, setResult]                 = useState<CatInterpretation | null>(null);
  const [resultUri, setResultUri]           = useState<string | undefined>(undefined);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording]           = useState<Audio.Recording | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [analyzingHintIndex, setAnalyzingHintIndex] = useState(0);
  const actionLockRef = useRef(false);
  const recordingAbortRef = useRef<AbortController | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const barAnims = useRef(BAR_DURATIONS.map(() => new Animated.Value(4))).current;
  const barLoops = useRef<Animated.CompositeAnimation[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
    return () => {
      recordingAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
      barLoops.current = barAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 36, duration: BAR_DURATIONS[i], useNativeDriver: false }),
            Animated.timing(anim, { toValue: 4,  duration: BAR_DURATIONS[i], useNativeDriver: false }),
          ])
        )
      );
      barLoops.current.forEach((loop) => loop.start());
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
      barLoops.current.forEach((loop) => loop.stop());
      barAnims.forEach((anim) => anim.setValue(4));
    }
  }, [recordingState]);

  useEffect(() => {
    if (result !== null) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
    }
  }, [result]);

  const isAnalyzing = appState === 'analyzing';

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzingHintIndex(0);
      return;
    }
    const intervalId = setInterval(() => {
      setAnalyzingHintIndex((prev) => (prev + 1) % strings.translate.analyzingHints.length);
    }, ANALYZING_HINT_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isAnalyzing, strings.translate.analyzingHints.length]);

  const handleRecordPress = async () => {
    if (actionLockRef.current || appState === 'analyzing') return;
    actionLockRef.current = true;

    if (recordingState === 'idle') {
      setPermissionError(false);
      try {
        const nextRecording = await startCatRecordingSession({
          onPermissionDenied: () => { setPermissionError(true); },
          onPermissionGranted: () => { setPermissionError(false); },
        });
        if (!nextRecording) return;
        setRecording(nextRecording);
        setRecordingState('recording');
      } finally {
        actionLockRef.current = false;
      }
    } else {
      try {
        recordingAbortRef.current = new AbortController();
        setRecording(null);
        setRecordingState('idle');
        await runCatAudioAnalysisTransaction({
          recording,
          language,
          profile,
          personaState,
          log,
          addLog,
          signal: recordingAbortRef.current.signal,
          onStartAnalysis: () => {
            setAppState('analyzing');
            setResult(null);
            setResultUri(undefined);
          },
          onInterpretation: (interpretation, uri) => {
            setResult(interpretation);
            setResultUri(uri);
            setAppState('result');
          },
          onComplete: () => {
            actionLockRef.current = false;
            recordingAbortRef.current = null;
          },
        });
      } catch {
        actionLockRef.current = false;
        setRecording(null);
        setRecordingState('idle');
        setAppState('idle');
        setResult(null);
        recordingAbortRef.current = null;
      }
    }
  };

  const devAnalysisLabel = getLocalAnalysisDebugLabel({ provider: 'local', ready: true });
  const isMixedResult = result?.primaryIntent === 'unknown';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{strings.common.back}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{strings.translate.title}</Text>
        <Text style={styles.subtitle}>{strings.translate.subtitle}</Text>
        {!!devAnalysisLabel && <Text style={styles.devStatus}>{devAnalysisLabel}</Text>}
      </View>

      {/* Analyzing state */}
      {isAnalyzing && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#a0e0c0" />
          <Text style={styles.analyzingText}>{strings.translate.analyzing}</Text>
          <Text style={styles.analyzingHint}>
            {strings.translate.analyzingHints[analyzingHintIndex]}
          </Text>
        </View>
      )}

      {/* Result card — Version A: avatar → intent chip → hero text → subtitle → hairline → confidence + replay */}
      {appState === 'result' && result && (
        <>
          <Animated.View style={[styles.card, styles.resultCard, { opacity: fadeAnim }]}>

            {/* Corner bracket accents */}
            <View style={[styles.corner, { top: 14, left: 14, borderTopWidth: 1, borderLeftWidth: 1 }]} />
            <View style={[styles.corner, { top: 14, right: 14, borderTopWidth: 1, borderRightWidth: 1 }]} />
            <View style={[styles.corner, { bottom: 14, left: 14, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
            <View style={[styles.corner, { bottom: 14, right: 14, borderBottomWidth: 1, borderRightWidth: 1 }]} />

            {/* Avatar — no label, mood conveys state */}
            <CatAvatar
              mood={getAvatarMoodFromInterpretation(result)}
              size="large"
              showLabel={false}
            />

            {/* Intent chip — quiet pill, glyph + lowercase label */}
            <View style={styles.intentChip}>
              <Text style={[styles.intentGlyph, { color: INTENT_CHIP_COLOR[result.primaryIntent] }]}>
                {INTENT_GLYPH[result.primaryIntent]}
              </Text>
              <Text style={styles.intentLabel}>
                {getIntentLabel(result.primaryIntent, language).toLowerCase()}
              </Text>
            </View>

            {/* summaryText — the hero */}
            <Text style={styles.heroText}>{result.translatedText}</Text>

            {/* catSubtitle — italic flavor layer */}
            <Text style={styles.subtitleItalic}>"{result.catSubtitle}"</Text>

            {/* Mixed hint — only when read stays open */}
            {isMixedResult && (
              <Text style={styles.mixedHint}>{strings.translate.mixedHint}</Text>
            )}

            {/* Hairline separator */}
            <View style={styles.hairline} />

            {/* Confidence — moon glyph + soft word, no percentage */}
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceMoon}>
                {CONFIDENCE_GLYPH[result.confidenceBand]}
              </Text>
              <Text style={styles.confidenceWord}>
                {getConfidenceBandLabel(result.confidenceBand, language)}
              </Text>
            </View>

            {/* Replay — muted text link */}
            <TouchableOpacity
              onPress={() =>
                playLoggedCatSound({
                  recordingUri: resultUri,
                  fallbackSoundKey: result.soundKey,
                  allowSyntheticFallback: false,
                })
              }
              activeOpacity={0.6}
              disabled={!resultUri}
            >
              <Text
                style={[styles.replayLink, !resultUri && styles.replayLinkDisabled]}
                numberOfLines={1}
              >
                {strings.translate.replayCta}
              </Text>
            </TouchableOpacity>

          </Animated.View>

          <TouchableOpacity
            style={styles.buttonRepeat}
            onPress={() => { setAppState('idle'); setResultUri(undefined); }}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonRepeatText}>{strings.translate.listenAgain}</Text>
          </TouchableOpacity>
        </>
      )}

      {appState === 'idle' && <View style={styles.cardPlaceholder} />}

      {!isAnalyzing && appState !== 'result' && (
        <View style={styles.recSection}>
          <Text style={styles.recLabel}>{strings.translate.prompt}</Text>

          {recordingState === 'recording' && (
            <View style={styles.waveform}>
              {barAnims.map((anim, i) => (
                <Animated.View key={i} style={[styles.waveBar, { height: anim }]} />
              ))}
            </View>
          )}

          <Animated.View style={{ opacity: recordingState === 'recording' ? pulseAnim : 1 }}>
            <TouchableOpacity
              style={[styles.recButton, recordingState === 'recording' && styles.recButtonActive]}
              onPress={handleRecordPress}
              activeOpacity={0.75}
              disabled={actionLockRef.current}
            >
              <Text style={[styles.recButtonText, recordingState === 'recording' && styles.recButtonTextActive]}>
                {recordingState === 'recording'
                  ? strings.common.stopLabel
                  : strings.common.recLabel}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {permissionError && (
            <Text style={styles.permissionError}>{strings.common.micPermission}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  backText: {
    color: '#a0e0c0',
    fontSize: 15,
    letterSpacing: 1,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#e8e8f0',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
  },
  subtitle: {
    color: '#6a6a88',
    fontSize: 13,
    letterSpacing: 2,
  },
  devStatus: {
    color: '#557565',
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'monospace',
    marginTop: 2,
  },

  // Shared card base (analyzing + result)
  card: {
    width: '100%',
    backgroundColor: '#1a1a26',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    padding: 28,
    alignItems: 'center',
    gap: 12,
    minHeight: 140,
    justifyContent: 'center',
  },

  // Result-only card overrides — Version A layout
  resultCard: {
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 28,
    gap: 0,
    justifyContent: 'flex-start',
    minHeight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },

  // Corner bracket accents
  corner: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderColor: '#30304a',
  },

  // Intent chip
  intentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1e1c2e',
    borderWidth: 1,
    borderColor: '#2c2a42',
    marginTop: 18,
    marginBottom: 18,
  },
  intentGlyph: {
    fontSize: 13,
    lineHeight: 16,
  },
  intentLabel: {
    color: '#7878a8',
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },

  // summaryText — hero
  heroText: {
    color: '#e4e4f0',
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.1,
    marginBottom: 12,
  },

  // catSubtitle — italic flavor
  subtitleItalic: {
    color: '#9090b8',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    opacity: 0.88,
  },

  // Mixed / unknown hint
  mixedHint: {
    color: '#5a5a80',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 4,
  },

  // Hairline
  hairline: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a3c',
    marginTop: 24,
    marginBottom: 14,
  },

  // Confidence row
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 10,
  },
  confidenceMoon: {
    color: '#5888a8',
    fontSize: 12,
    lineHeight: 15,
  },
  confidenceWord: {
    color: '#5888a8',
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: 'monospace',
  },

  // Replay text link
  replayLink: {
    color: '#5070a0',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  replayLinkDisabled: {
    color: '#303048',
  },

  cardPlaceholder: {
    width: '100%',
    minHeight: 140,
  },

  analyzingText: {
    color: '#c9c9db',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  analyzingHint: {
    color: '#757593',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  recSection: {
    alignItems: 'center',
    gap: 8,
  },
  recLabel: {
    color: '#888888',
    fontSize: 12,
    letterSpacing: 1,
  },
  waveform: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#a0e0c0',
  },
  recButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#a0e0c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recButtonActive: {
    backgroundColor: '#e05050',
    borderColor: '#e05050',
  },
  recButtonText: {
    color: '#a0e0c0',
    fontSize: 14,
    letterSpacing: 2,
  },
  recButtonTextActive: {
    color: '#ffffff',
  },
  permissionError: {
    color: '#e05050',
    fontSize: 12,
    textAlign: 'center',
  },
  buttonRepeat: {
    borderWidth: 1,
    borderColor: '#a0e0c0',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 40,
  },
  buttonRepeatText: {
    color: '#a0e0c0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },
});

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
  getMoodLabel,
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Translate'>;
};

type AppState = 'idle' | 'analyzing' | 'result';
type RecordingState = 'idle' | 'recording';

const BAR_DURATIONS = [280, 340, 220, 380, 260];
const ANALYZING_HINT_INTERVAL_MS = 1100;

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

  // Pulse animation for REC button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Waveform bar animations
  const barAnims = useRef(BAR_DURATIONS.map(() => new Animated.Value(4))).current;
  const barLoops = useRef<Animated.CompositeAnimation[]>([]);

  // Result card fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Audio mode on mount
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

  // Pulse + waveform lifecycle
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

  // Fade in result card
  useEffect(() => {
    if (result !== null) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
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
          onPermissionDenied: () => {
            setPermissionError(true);
          },
          onPermissionGranted: () => {
            setPermissionError(false);
          },
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

  const devAnalysisLabel = getLocalAnalysisDebugLabel({
    provider: 'local',
    ready: true,
  });
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

      {isAnalyzing && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#a0e0c0" />
          <Text style={styles.analyzingText}>{strings.translate.analyzing}</Text>
          <Text style={styles.analyzingHint}>
            {strings.translate.analyzingHints[analyzingHintIndex]}
          </Text>
        </View>
      )}

      {appState === 'result' && result && (
          <>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <CatAvatar mood={getAvatarMoodFromInterpretation(result)} size="large" />
            <Text style={styles.moodBadge}>{getMoodLabel(result.mood, language)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>{getIntentLabel(result.primaryIntent, language)}</Text>
              <Text style={styles.metaPill}>
                {getConfidenceBandLabel(result.confidenceBand, language)}
              </Text>
            </View>
            <Text style={styles.translatedText}>{result.translatedText}</Text>
            <Text style={styles.catSubtitle}>{result.catSubtitle}</Text>
            <TouchableOpacity
              style={styles.replayButton}
              onPress={() =>
                playLoggedCatSound({
                  recordingUri: resultUri,
                  fallbackSoundKey: result.soundKey,
                  allowSyntheticFallback: false,
                })
              }
              activeOpacity={0.75}
              disabled={!resultUri}
            >
              <Text style={[styles.replayText, !resultUri && styles.replayTextDisabled]}>
                {strings.translate.replayCta}
              </Text>
            </TouchableOpacity>
            <Text style={styles.resultHint}>
              {isMixedResult ? strings.translate.mixedHint : strings.translate.resultHint}
            </Text>
            <Text style={styles.savedHint}>{strings.translate.resultSaved}</Text>
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
  card: {
    width: '100%',
    backgroundColor: '#1a1a26',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    padding: 28,
    alignItems: 'center',
    gap: 12,
    minHeight: 140,
    justifyContent: 'center',
  },
  cardPlaceholder: {
    width: '100%',
    minHeight: 140,
  },
  moodBadge: {
    color: '#a0e0c0',
    fontSize: 12,
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: '#a0e0c0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaPill: {
    color: '#7fcfaf',
    fontSize: 10,
    letterSpacing: 1.2,
    borderWidth: 1,
    borderColor: '#355242',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  catSubtitle: {
    color: '#8d8dad',
    fontSize: 15,
    letterSpacing: 1,
    textAlign: 'center',
  },
  translatedText: {
    color: '#d8d8f0',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
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
  replayButton: {
    marginTop: 4,
  },
  replayText: {
    color: '#a0e0c0',
    fontSize: 14,
    marginTop: 12,
    alignSelf: 'center',
  },
  replayTextDisabled: {
    color: '#4e5a58',
  },
  resultHint: {
    color: '#8a8aa6',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  savedHint: {
    color: '#5f7d70',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.6,
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

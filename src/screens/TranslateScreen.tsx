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
  CatInterpretation,
  getAvatarMoodFromInterpretation,
} from '../logic/analyzeCatAudio';
import {
  runCatAudioAnalysisTransaction,
  startCatRecordingSession,
} from '../logic/textConversation';
import { playSound } from '../utils/playSound';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Translate'>;
};

const COPY = {
  ja: {
    title: 'CAT TRANSLATOR',
    subtitle: 'Cat → Human Interpreter',
    listenAgain: 'もう一度聞かせる',
    analyzing: '解析中…',
  },
} as const;
const t = COPY.ja;

type AppState = 'idle' | 'analyzing' | 'result';
type RecordingState = 'idle' | 'recording';

const BAR_DURATIONS = [280, 340, 220, 380, 260];

export default function TranslateScreen({ navigation }: Props) {
  const { profile, personaState, addLog } = useCat();
  const [appState, setAppState]             = useState<AppState>('idle');
  const [result, setResult]                 = useState<CatInterpretation | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording]           = useState<Audio.Recording | null>(null);
  const [permissionError, setPermissionError] = useState(false);
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
          profile,
          personaState,
          addLog,
          signal: recordingAbortRef.current.signal,
          onStartAnalysis: () => {
            setAppState('analyzing');
            setResult(null);
          },
          onInterpretation: (interpretation) => {
            setResult(interpretation);
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

  const isAnalyzing = appState === 'analyzing';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      {isAnalyzing && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#a0e0c0" />
          <Text style={styles.analyzingText}>{t.analyzing}</Text>
        </View>
      )}

      {appState === 'result' && result && (
        <>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <CatAvatar mood={getAvatarMoodFromInterpretation(result)} size="large" />
            <Text style={styles.moodBadge}>{result.mood}</Text>
            <Text style={styles.catSubtitle}>{result.catSubtitle}</Text>
            <Text style={styles.translatedText}>{result.translatedText}</Text>
            <TouchableOpacity
              onPress={() => playSound(result.soundKey)}
              activeOpacity={0.75}
            >
              <Text style={styles.replayText}>▶ もう一度再生</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.buttonRepeat} onPress={() => setAppState('idle')} activeOpacity={0.75}>
            <Text style={styles.buttonRepeatText}>{t.listenAgain}</Text>
          </TouchableOpacity>
        </>
      )}

      {appState === 'idle' && <View style={styles.cardPlaceholder} />}

      {!isAnalyzing && appState !== 'result' && (
        <View style={styles.recSection}>
          <Text style={styles.recLabel}>猫の声を聞かせる</Text>

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
                {recordingState === 'recording' ? '■ STOP' : '● REC'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {permissionError && (
            <Text style={styles.permissionError}>マイクのアクセスを許可してください</Text>
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
  catSubtitle: {
    color: '#8080a8',
    fontSize: 20,
    letterSpacing: 2,
  },
  translatedText: {
    color: '#d8d8f0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  analyzingText: {
    color: '#6a6a88',
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 8,
  },
  replayText: {
    color: '#a0e0c0',
    fontSize: 13,
    marginTop: 12,
    alignSelf: 'center',
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

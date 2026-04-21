import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import CatAvatar from '../components/CatAvatar';
import { useCat } from '../context/CatContext';
import { CatReply, generateCatReply, SOUND_AVATAR } from '../logic/generateCatReply';
import { playSound } from '../utils/playSound';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Speak'>;
};

type UiState = 'idle' | 'loading' | 'result';

export default function SpeakScreen({ navigation }: Props) {
  const { addLog } = useCat();
  const [inputText, setInputText] = useState('');
  const [uiState, setUiState] = useState<UiState>('idle');
  const [result, setResult] = useState<CatReply | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });

    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (result !== null) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [result]);

  const canSend = inputText.trim().length > 0;

  const handleSend = () => {
    if (!canSend || uiState === 'loading' || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setUiState('loading');
    setResult(null);
    sendTimeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await generateCatReply({ text: inputText.trim() });
          setResult(res);
          setUiState('result');
          playSound(res.soundKey);
          addLog({
            direction:     'human_to_cat',
            rawText:       res.catSound,
            translatedText: res.responseText,
            catSubtitle:   res.catSound,
            soundKey:      res.soundKey,
            mood:          res.mood,
            source:        'mock',
            inputMode:     'text',
          });
        } finally {
          isSubmittingRef.current = false;
          sendTimeoutRef.current = null;
        }
      })();
    }, 1000);
  };

  const handleReset = () => {
    if (uiState === 'loading') return;
    setUiState('idle');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>話しかける</Text>
          <Text style={styles.subtitle}>猫に伝えたいことを入力してください</Text>
        </View>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="例：大好きだよ、かわいいね"
          placeholderTextColor="#4a4a66"
          multiline
          numberOfLines={3}
          maxLength={200}
          textAlignVertical="top"
          editable={uiState !== 'loading'}
        />

        {uiState !== 'result' && (
          <TouchableOpacity
            style={[styles.button, (!canSend || uiState === 'loading') && styles.buttonDisabled]}
            onPress={handleSend}
            activeOpacity={0.75}
            disabled={!canSend || uiState === 'loading'}
          >
            <Text style={[styles.buttonText, (!canSend || uiState === 'loading') && styles.buttonTextDisabled]}>
              猫語に変換する
            </Text>
          </TouchableOpacity>
        )}

        {uiState === 'loading' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#a0e0c0" />
            <Text style={styles.loadingText}>変換中…</Text>
          </View>
        )}

        {uiState === 'result' && result && (
          <>
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <CatAvatar mood={SOUND_AVATAR[result.soundKey] ?? 'neutral'} size="large" />
              <Text style={styles.moodBadge}>猫語</Text>
              <Text style={styles.catSound}>{result.catSound}</Text>
              <Text style={styles.translatedText}>{result.responseText}</Text>
              <TouchableOpacity onPress={() => playSound(result.soundKey)} activeOpacity={0.75}>
                <Text style={styles.replayText}>▶ もう一度再生</Text>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={styles.buttonRepeat} onPress={handleReset} activeOpacity={0.75}>
              <Text style={styles.buttonRepeatText}>もう一度話しかける</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0e0e14',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
  },
  backText: {
    color: '#a0e0c0',
    fontSize: 15,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#a0e0c0',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#6a6a88',
    fontSize: 13,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#a0e0c0',
    borderRadius: 16,
    padding: 16,
    color: '#e8e8f0',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
  },
  button: {
    backgroundColor: '#a0e0c0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 40,
  },
  buttonDisabled: {
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  buttonText: {
    color: '#0e0e14',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  buttonTextDisabled: {
    color: '#4a4a66',
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
  catSound: {
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
  loadingText: {
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

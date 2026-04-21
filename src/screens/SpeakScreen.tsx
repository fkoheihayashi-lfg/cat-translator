import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
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
import { getStrings } from '../i18n/strings';
import { CatReply, SOUND_AVATAR } from '../logic/generateCatReply';
import { runHumanToCatTextTransaction } from '../logic/textConversation';
import { playSound } from '../utils/playSound';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Speak'>;
};

type UiState = 'idle' | 'loading' | 'result';

export default function SpeakScreen({ navigation }: Props) {
  const { profile, language, personaState, log, addLog } = useCat();
  const strings = getStrings(language);
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
          await runHumanToCatTextTransaction({
            text: inputText.trim(),
            language,
            profile,
            personaState,
            log,
            addLog,
            dismissKeyboard: Keyboard.dismiss,
            onReply: (reply) => {
              setResult(reply);
              setUiState('result');
            },
            onComplete: () => {
              isSubmittingRef.current = false;
              sendTimeoutRef.current = null;
            },
          });
        } finally {
          if (isSubmittingRef.current) {
            isSubmittingRef.current = false;
            sendTimeoutRef.current = null;
          }
        }
      })();
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{strings.common.back}</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{strings.speak.title}</Text>
          <Text style={styles.subtitle}>{strings.speak.subtitle}</Text>
        </View>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={strings.speak.inputPlaceholder}
            placeholderTextColor="#4a4a66"
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
            editable={uiState !== 'loading'}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!canSend || uiState === 'loading') && styles.sendButtonDisabled]}
            onPress={handleSend}
            activeOpacity={0.75}
            disabled={!canSend || uiState === 'loading'}
          >
            <Text
              style={[
                styles.sendButtonText,
                (!canSend || uiState === 'loading') && styles.sendButtonTextDisabled,
              ]}
            >
              {strings.common.send}
            </Text>
          </TouchableOpacity>
        </View>

        {uiState === 'loading' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#a0e0c0" />
            <Text style={styles.loadingText}>{strings.speak.loading}</Text>
          </View>
        )}

        {uiState === 'result' && result && (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <CatAvatar mood={SOUND_AVATAR[result.soundKey] ?? 'neutral'} size="large" />
            <Text style={styles.moodBadge}>{strings.speak.badge}</Text>
            <Text style={styles.catSound}>{result.catSound}</Text>
            <Text style={styles.translatedText}>{result.responseText}</Text>
            <TouchableOpacity onPress={() => playSound(result.soundKey)} activeOpacity={0.75}>
              <Text style={styles.replayText}>{strings.common.replayAgain}</Text>
            </TouchableOpacity>
          </Animated.View>
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
  composer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
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
    flex: 1,
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
  sendButton: {
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#a0e0c0',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  sendButtonText: {
    color: '#a0e0c0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sendButtonTextDisabled: {
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
});

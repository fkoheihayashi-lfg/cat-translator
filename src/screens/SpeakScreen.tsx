import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Speak'>;
};

type UiState = 'idle' | 'loading' | 'result';

type CatReply = {
  catSound: string;
  responseText: string;
};

function getLocalCatResponse(input: string): CatReply {
  if (/好き|大好き|愛してる/.test(input))
    return { catSound: 'にゃぁ…♡', responseText: '…うれしいにゃ。もっと言ってほしいにゃ。' };
  if (/かわいい|きれい/.test(input))
    return { catSound: 'ふにゃ', responseText: 'わかってるにゃ。でも、もっと言うにゃ。' };
  if (/ごはん|ご飯|食べ|おなか/.test(input))
    return { catSound: 'にゃーっ！', responseText: 'はやくするにゃ！待ってるにゃ！' };
  if (/遊|あそ|遊ぼ/.test(input))
    return { catSound: 'みゃっ！', responseText: 'いいにゃ！今すぐ来るにゃ！' };
  if (/ねむ|眠|寝よ|おやすみ/.test(input))
    return { catSound: 'ごろ…にゃ', responseText: '…いっしょに寝るにゃ。あったかいにゃ。' };
  if (/どこ|いない|さびし|寂し/.test(input))
    return { catSound: 'にゃ…？', responseText: 'ちゃんとここにいるにゃ。心配しなくていいにゃ。' };
  if (/だめ|ダメ|やめ|こら/.test(input))
    return { catSound: 'むにゃ', responseText: '…別にいいじゃないにゃ。' };
  return { catSound: 'にゃ', responseText: '…なんか言ってるにゃ。よくわからないにゃ。' };
}

export default function SpeakScreen({ navigation }: Props) {
  const [inputText, setInputText] = useState('');
  const [uiState, setUiState] = useState<UiState>('idle');
  const [result, setResult] = useState<CatReply | null>(null);

  const canSend = inputText.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setUiState('loading');
    setResult(null);
    setTimeout(() => {
      setResult(getLocalCatResponse(inputText.trim()));
      setUiState('result');
    }, 1000);
  };

  const handleReset = () => {
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
            <View style={styles.card}>
              <Text style={styles.moodBadge}>猫語</Text>
              <Text style={styles.catSound}>{result.catSound}</Text>
              <Text style={styles.translatedText}>{result.responseText}</Text>
            </View>
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

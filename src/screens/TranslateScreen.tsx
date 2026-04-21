import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Translate'>;
};

type CatResult = {
  mood: string;
  catSubtitle: string;
  translatedText: string;
};

const MOCK_RESULTS: CatResult[] = [
  { mood: '甘え', catSubtitle: 'にゃぁ…', translatedText: 'ねえ、ちょっと構ってほしいんだけど。' },
  { mood: '要求', catSubtitle: 'にゃー！', translatedText: 'ごはんのこと、そろそろ思い出してくれた？' },
  { mood: '不満', catSubtitle: 'むぅにゃ', translatedText: '今はあんまり触られたい気分じゃないかも。' },
  { mood: '興味', catSubtitle: 'みゃ？', translatedText: 'それなに？ちょっと気になる。' },
  { mood: '安心', catSubtitle: 'ごろ…にゃ', translatedText: 'うん、いまは落ち着いてるよ。' },
];

const COPY = {
  ja: {
    title: 'CAT TRANSLATOR',
    subtitle: 'Cat → Human Interpreter',
    listen: '聞かせる',
    listenAgain: 'もう一度聞かせる',
    analyzing: '解析中…',
  },
  en: {
    title: 'CAT TRANSLATOR',
    subtitle: 'Cat → Human Interpreter',
    listen: 'Listen',
    listenAgain: 'Listen Again',
    analyzing: 'Analyzing…',
  },
} as const;

const locale: keyof typeof COPY = 'ja';
const t = COPY[locale];

type AppState = 'idle' | 'analyzing' | 'result';

export default function TranslateScreen({ navigation }: Props) {
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<CatResult | null>(null);

  const handlePress = () => {
    setAppState('analyzing');
    setResult(null);
    setTimeout(() => {
      const picked = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(picked);
      setAppState('result');
    }, 1200);
  };

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

      {appState === 'analyzing' && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#a0e0c0" />
          <Text style={styles.analyzingText}>{t.analyzing}</Text>
        </View>
      )}

      {appState === 'result' && result && (
        <>
          <View style={styles.card}>
            <Text style={styles.moodBadge}>{result.mood}</Text>
            <Text style={styles.catSubtitle}>{result.catSubtitle}</Text>
            <Text style={styles.translatedText}>{result.translatedText}</Text>
          </View>
          <TouchableOpacity style={styles.buttonRepeat} onPress={handlePress} activeOpacity={0.75}>
            <Text style={styles.buttonRepeatText}>{t.listenAgain}</Text>
          </TouchableOpacity>
        </>
      )}

      {appState === 'idle' && <View style={styles.cardPlaceholder} />}

      {appState === 'idle' && (
        <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.75}>
          <Text style={styles.buttonText}>{t.listen}</Text>
        </TouchableOpacity>
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
  button: {
    backgroundColor: '#a0e0c0',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 40,
  },
  buttonText: {
    color: '#0e0e14',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
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

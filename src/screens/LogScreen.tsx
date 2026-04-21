import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Log'>;
};

type LogEntry = {
  id: number;
  direction: 'cat_to_human' | 'human_to_cat';
  catSound: string;
  text: string;
  timestamp: string;
};

const MOCK_LOG: LogEntry[] = [
  { id: 1, direction: 'cat_to_human', catSound: 'にゃーっ！', text: 'ごはんのこと、そろそろ思い出してくれた？',  timestamp: '今日 14:32' },
  { id: 2, direction: 'human_to_cat', catSound: 'にゃぁ…♡',  text: '…うれしいにゃ。もっと言ってほしいにゃ。',  timestamp: '今日 13:15' },
  { id: 3, direction: 'cat_to_human', catSound: 'みゃ？',     text: 'それなに？ちょっと気になる。',              timestamp: '今日 11:02' },
  { id: 4, direction: 'human_to_cat', catSound: 'にゃーっ！', text: 'はやくするにゃ！待ってるにゃ！',            timestamp: '昨日 20:44' },
  { id: 5, direction: 'cat_to_human', catSound: 'ごろ…にゃ',  text: 'うん、いまは落ち着いてるよ。',             timestamp: '昨日 18:30' },
  { id: 6, direction: 'human_to_cat', catSound: 'ふにゃ',     text: 'わかってるにゃ。でも、もっと言うにゃ。',  timestamp: '昨日 10:11' },
];

export default function LogScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>会話ログ</Text>
        <Text style={styles.subtitle}>最近の会話</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_LOG.map((entry) => {
          const isCatToHuman = entry.direction === 'cat_to_human';
          return (
            <View key={entry.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, isCatToHuman ? styles.badgeCat : styles.badgeHuman]}>
                  <Text style={[styles.badgeText, isCatToHuman ? styles.badgeTextCat : styles.badgeTextHuman]}>
                    {isCatToHuman ? '猫 → 人間' : '人間 → 猫'}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{entry.timestamp}</Text>
              </View>
              <Text style={styles.catSound}>{entry.catSound}</Text>
              <Text style={styles.entryText}>{entry.text}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    color: '#a0e0c0',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 3,
  },
  subtitle: {
    color: '#6a6a88',
    fontSize: 12,
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCat: {
    backgroundColor: '#1e3a2e',
  },
  badgeHuman: {
    backgroundColor: '#1a1a3a',
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
  },
  badgeTextCat: {
    color: '#a0e0c0',
  },
  badgeTextHuman: {
    color: '#a0a0e0',
  },
  timestamp: {
    color: '#4a4a66',
    fontSize: 11,
  },
  catSound: {
    color: '#ffffff',
    fontSize: 20,
    letterSpacing: 1,
  },
  entryText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});

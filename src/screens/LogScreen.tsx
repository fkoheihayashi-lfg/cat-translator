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
import { LogEntry, useCat } from '../context/CatContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Log'>;
};

function formatTimestamp(createdAt: number): string {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `今日 ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `昨日 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

function EntryCard({ entry }: { entry: LogEntry }) {
  const isCatToHuman = entry.direction === 'cat_to_human';

  return (
    <View style={styles.card}>
      {/* Top row: badge + timestamp */}
      <View style={styles.cardTop}>
        <View style={[styles.badge, isCatToHuman ? styles.badgeCat : styles.badgeHuman]}>
          <Text style={[styles.badgeText, isCatToHuman ? styles.badgeTextCat : styles.badgeTextHuman]}>
            {isCatToHuman ? '猫 → 人間' : '人間 → 猫'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(entry.createdAt)}</Text>
      </View>

      {/* Cat sound */}
      <Text style={styles.catSound}>{entry.rawText}</Text>

      {/* Translation */}
      <Text style={styles.entryText}>{entry.translatedText}</Text>

      {/* Mood + source meta row */}
      {(entry.mood || entry.inputMode) && (
        <View style={styles.metaRow}>
          {entry.mood ? (
            <Text style={styles.metaMood}>{entry.mood}</Text>
          ) : null}
          <Text style={styles.metaSource}>
            {entry.inputMode === 'recording' ? '● REC' : '✎ TEXT'}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function LogScreen({ navigation }: Props) {
  const { log } = useCat();
  const entries = [...log].reverse();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>会話ログ</Text>
        <Text style={styles.subtitle}>最近の会話 · {entries.length} 件</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>（・ω・）</Text>
            <Text style={styles.emptyTitle}>まだ会話がありません</Text>
            <Text style={styles.emptySubtitle}>猫の声を聞かせてみてください</Text>
          </View>
        ) : (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
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
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    letterSpacing: 0.5,
  },
  catSound: {
    color: '#e8e8f0',
    fontSize: 20,
    letterSpacing: 1,
  },
  entryText: {
    color: '#9090a8',
    fontSize: 14,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#242430',
    paddingTop: 8,
  },
  metaMood: {
    color: '#a0e0c0',
    fontSize: 10,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: '#2a4a3a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  metaSource: {
    color: '#4a4a66',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
    color: '#333344',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#555566',
    fontSize: 14,
    letterSpacing: 1,
  },
  emptySubtitle: {
    color: '#333344',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

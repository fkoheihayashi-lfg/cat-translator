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
import { useCat } from '../context/CatContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Log'>;
};

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
        <Text style={styles.subtitle}>最近の会話</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>まだ会話がありません</Text>
            <Text style={styles.emptySubtitle}>猫の声を聞かせてみてください</Text>
          </View>
        )}
        {entries.map((entry) => {
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
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    color: '#444444',
    fontSize: 14,
  },
  emptySubtitle: {
    color: '#333333',
    fontSize: 12,
    marginTop: 6,
  },
  entryText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});

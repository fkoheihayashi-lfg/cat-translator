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
import {
  getAnalysisModeLabel,
  getConfidenceBandLabel,
  getIntentLabel,
  formatLogTime,
  formatWithVars,
  getMoodLabel,
  getStrings,
} from '../i18n/strings';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Log'>;
};

function EntryCard({
  entry,
  language,
}: {
  entry: LogEntry;
  language: 'ja' | 'en';
}) {
  const strings = getStrings(language);
  const isCatToHuman = entry.direction === 'cat_to_human';

  return (
    <View style={styles.card}>
      {/* Top row: badge + timestamp */}
      <View style={styles.cardTop}>
        <View style={[styles.badge, isCatToHuman ? styles.badgeCat : styles.badgeHuman]}>
          <Text style={[styles.badgeText, isCatToHuman ? styles.badgeTextCat : styles.badgeTextHuman]}>
            {isCatToHuman ? strings.common.catToHuman : strings.common.humanToCat}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatLogTime(entry.createdAt, language)}</Text>
      </View>

      {/* Cat sound */}
      <Text style={styles.catSound}>{entry.rawText}</Text>

      {/* Translation */}
      <Text style={styles.entryText}>{entry.translatedText}</Text>

      {/* Mood + source meta row */}
      {(entry.mood || entry.inputMode) && (
        <View style={styles.metaRow}>
          {entry.mood ? (
            <Text style={styles.metaMood}>{getMoodLabel(entry.mood, language)}</Text>
          ) : null}
          {entry.direction === 'cat_to_human' && entry.primaryIntent ? (
            <Text style={styles.metaMood}>{getIntentLabel(entry.primaryIntent, language)}</Text>
          ) : null}
          {entry.direction === 'cat_to_human' && entry.confidenceBand ? (
            <Text style={styles.metaMood}>
              {getConfidenceBandLabel(entry.confidenceBand, language)}
            </Text>
          ) : null}
          <Text style={styles.metaSource}>
            {entry.inputMode === 'recording'
              ? strings.common.recordingMode
              : strings.common.textMode}
          </Text>
        </View>
      )}
      {entry.direction === 'cat_to_human' && entry.analysisMode ? (
        <Text style={styles.analysisMode}>
          {getAnalysisModeLabel(entry.analysisMode, language)}
        </Text>
      ) : null}
    </View>
  );
}

export default function LogScreen({ navigation }: Props) {
  const { language, log } = useCat();
  const strings = getStrings(language);
  const entries = [...log].reverse();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{strings.common.back}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{strings.log.title}</Text>
        <Text style={styles.subtitle}>
          {formatWithVars(strings.log.subtitle, { count: entries.length })}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>（・ω・）</Text>
            <Text style={styles.emptyTitle}>{strings.log.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{strings.log.emptySubtitle}</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} language={language} />
          ))
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
  analysisMode: {
    color: '#586271',
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    marginTop: 6,
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

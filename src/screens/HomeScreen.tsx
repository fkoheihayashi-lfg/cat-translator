import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../App';
import { useCat } from '../context/CatContext';
import {
  getBondHintText,
  getRecentThemeSummaryText,
  getStrings,
} from '../i18n/strings';
import {
  getHomeLogSummaryText,
  getHomeStatusText,
} from '../logic/statusText';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function HomeScreen({ navigation }: Props) {
  const { profile, language, setLanguage, personaState, log } = useCat();
  const strings = getStrings(language);
  const latestLog = log.length > 0 ? log[log.length - 1] : null;
  const statusText = getHomeStatusText(profile.name, personaState, language);
  const logSummaryText = getHomeLogSummaryText(log.length, personaState, language);
  const latestHint = latestLog
    ? latestLog.direction === 'cat_to_human'
      ? `${strings.home.latestReceived}: ${latestLog.translatedText}`
      : `${strings.home.latestSent}: ${latestLog.translatedText}`
    : `${getBondHintText(personaState, language)} · ${getRecentThemeSummaryText(personaState, language)}`;

  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.langToggle}>
        <TouchableOpacity onPress={() => setLanguage('ja')} activeOpacity={0.7}>
          <Text style={[styles.langButton, language === 'ja' && styles.langButtonActive]}>JA</Text>
        </TouchableOpacity>
        <Text style={styles.langDivider}>|</Text>
        <TouchableOpacity onPress={() => setLanguage('en')} activeOpacity={0.7}>
          <Text style={[styles.langButton, language === 'en' && styles.langButtonActive]}>EN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.top}>
        <View style={styles.commLinkRow}>
          <Text style={styles.commLink}>CAT COMM LINK </Text>
          <Animated.Text style={[styles.commLink, { opacity: blink }]}>◆</Animated.Text>
          <Text style={styles.commLink}> ACTIVE</Text>
        </View>
        <Text style={styles.title}>{strings.home.title}</Text>
        <Text style={styles.subtitle}>{strings.home.subtitle}</Text>
      </View>

      <View style={styles.middle}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Conversation')}
          activeOpacity={0.75}
        >
          <Text style={styles.primaryButtonText}>{strings.home.startConversation}</Text>
        </TouchableOpacity>
        <Text style={styles.primaryHint}>{strings.home.startHint}</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Translate')}
          activeOpacity={0.75}
        >
          <Text style={styles.primaryButtonText}>{strings.home.listen}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Log')}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>{strings.home.log}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>{strings.home.profile}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBlock}>
        <Text style={[styles.footer, profile.name ? styles.footerActive : undefined]}>
          {statusText}
        </Text>
        <Text style={[styles.logCount, log.length === 0 ? styles.logCountMuted : undefined]}>
          {logSummaryText}
        </Text>
        <Text style={styles.lastHint} numberOfLines={2}>
          {latestHint}
        </Text>
      </View>
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
  },
  top: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 48,
  },
  commLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    opacity: 0.6,
  },
  commLink: {
    color: '#a0e0c0',
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  title: {
    color: '#a0e0c0',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#888888',
    fontSize: 13,
    letterSpacing: 2,
  },
  middle: {
    alignItems: 'center',
    gap: 0,
  },
  primaryButton: {
    width: 240,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a0e0c0',
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#a0e0c0',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
  },
  primaryHint: {
    color: '#5d5d72',
    fontSize: 11,
    letterSpacing: 1,
    marginTop: -4,
    marginBottom: 18,
  },
  bottom: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusBlock: {
    alignItems: 'center',
    marginTop: 40,
    minHeight: 40,
  },
  secondaryButton: {
    width: 240,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#888888',
    fontSize: 14,
    letterSpacing: 2,
  },
  langToggle: {
    position: 'absolute',
    top: 56,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langButton: {
    color: '#4a4a66',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  langButtonActive: {
    color: '#a0e0c0',
  },
  langDivider: {
    color: '#333344',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  footer: {
    color: '#444444',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  footerActive: {
    color: '#a0e0c0',
  },
  logCount: {
    color: '#666666',
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 1,
  },
  logCountMuted: {
    color: '#4c4c58',
  },
  lastHint: {
    color: '#59596b',
    fontSize: 10,
    marginTop: 6,
    maxWidth: 240,
    textAlign: 'center',
  },
});

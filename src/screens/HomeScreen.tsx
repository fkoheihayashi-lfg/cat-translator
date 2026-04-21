import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../App';
import { useCat } from '../context/CatContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function HomeScreen({ navigation }: Props) {
  const { profile, log } = useCat();

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

      <View style={styles.top}>
        <View style={styles.commLinkRow}>
          <Text style={styles.commLink}>CAT COMM LINK </Text>
          <Animated.Text style={[styles.commLink, { opacity: blink }]}>◆</Animated.Text>
          <Text style={styles.commLink}> ACTIVE</Text>
        </View>
        <Text style={styles.title}>CAT TRANSLATOR</Text>
        <Text style={styles.subtitle}>Cat · Human Interpreter</Text>
      </View>

      <View style={styles.middle}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Translate')}
          activeOpacity={0.75}
        >
          <Text style={styles.primaryButtonText}>聞かせる</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Speak')}
          activeOpacity={0.75}
        >
          <Text style={styles.primaryButtonText}>話しかける</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Log')}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>会話ログ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>猫プロフィール</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, profile.name ? styles.footerActive : undefined]}>
        {profile.name ? `◆ ${profile.name} との通信中` : '◆ NO CAT DATA LOADED'}
      </Text>
      {log.length > 0 && (
        <Text style={styles.logCount}>会話 {log.length} 件</Text>
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
  bottom: {
    alignItems: 'center',
    marginTop: 8,
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
  footer: {
    color: '#444444',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 40,
  },
  footerActive: {
    color: '#a0e0c0',
  },
  logCount: {
    color: '#666666',
    fontSize: 10,
    marginTop: 4,
  },
});

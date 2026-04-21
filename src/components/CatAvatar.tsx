import { StyleSheet, Text, View } from 'react-native';
import { useCat } from '../context/CatContext';

export type CatAvatarProps = {
  mood: 'happy' | 'hungry' | 'curious' | 'sleepy' | 'upset' | 'neutral';
  size?: 'small' | 'large';
};

const MOOD_DATA: Record<CatAvatarProps['mood'], { emoji: string; ja: string; en: string; color: string }> = {
  happy:   { emoji: '（＾ω＾）',    ja: 'うれしい',    en: 'happy',    color: '#a0e0c0' },
  hungry:  { emoji: '（＞ω＜）',    ja: 'おなかすいた', en: 'hungry',   color: '#e0c080' },
  curious: { emoji: '（・ω・？）',   ja: 'きになる',    en: 'curious',  color: '#a0c0e0' },
  sleepy:  { emoji: '（－ω－）zzz', ja: 'ねむい',      en: 'sleepy',   color: '#c0a0e0' },
  upset:   { emoji: '（＞＜）',     ja: 'ふまん',      en: 'upset',    color: '#e08080' },
  neutral: { emoji: '（・ω・）',    ja: 'ふつう',      en: 'neutral',  color: '#888888' },
};

export default function CatAvatar({ mood, size = 'large' }: CatAvatarProps) {
  const { language } = useCat();
  const { emoji, ja, en, color } = MOOD_DATA[mood];
  const label = language === 'en' ? en : ja;
  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, size === 'small' ? styles.emojiSmall : styles.emojiLarge]}>
        {emoji}
      </Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emoji: {
    color: '#e8e8f0',
  },
  emojiLarge: {
    fontSize: 32,
  },
  emojiSmall: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
  },
});

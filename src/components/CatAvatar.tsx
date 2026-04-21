import { StyleSheet, Text, View } from 'react-native';

export type CatAvatarProps = {
  mood: 'happy' | 'hungry' | 'curious' | 'sleepy' | 'upset' | 'neutral';
  size?: 'small' | 'large';
};

const MOOD_DATA: Record<CatAvatarProps['mood'], { emoji: string; label: string; color: string }> = {
  happy:   { emoji: '（＾ω＾）',    label: 'うれしい',    color: '#a0e0c0' },
  hungry:  { emoji: '（＞ω＜）',    label: 'おなかすいた', color: '#e0c080' },
  curious: { emoji: '（・ω・？）',   label: 'きになる',    color: '#a0c0e0' },
  sleepy:  { emoji: '（－ω－）zzz', label: 'ねむい',     color: '#c0a0e0' },
  upset:   { emoji: '（＞＜）',     label: 'ふまん',     color: '#e08080' },
  neutral: { emoji: '（・ω・）',    label: 'ふつう',     color: '#888888' },
};

export default function CatAvatar({ mood, size = 'large' }: CatAvatarProps) {
  const { emoji, label, color } = MOOD_DATA[mood];
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

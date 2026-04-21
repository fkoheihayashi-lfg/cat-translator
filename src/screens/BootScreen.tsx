import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Boot'>;
};

export default function BootScreen({ navigation }: Props) {
  const systemLabel = useRef(new Animated.Value(0)).current;
  const mainTitle   = useRef(new Animated.Value(0)).current;
  const subtitle    = useRef(new Animated.Value(0)).current;
  const statusLine  = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fade = (val: Animated.Value, delay: number) =>
      Animated.timing(val, { toValue: 1, duration: 400, delay, useNativeDriver: true });

    Animated.sequence([
      Animated.parallel([
        fade(systemLabel, 300),
        fade(mainTitle,   800),
        fade(subtitle,   1400),
        fade(statusLine, 2000),
      ]),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        delay: 2800,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.replace('Home'));
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.Text style={[styles.systemLabel, { opacity: systemLabel }]}>
        SYSTEM BOOT
      </Animated.Text>

      <Animated.Text style={[styles.title, { opacity: mainTitle }]}>
        CAT TRANSLATOR
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subtitle }]}>
        Cat · Human Interpreter
      </Animated.Text>

      <Animated.Text style={[styles.statusLine, { opacity: statusLine }]}>
        LINK ESTABLISHED ◆
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  systemLabel: {
    color: '#a0e0c0',
    fontSize: 11,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  title: {
    color: '#a0e0c0',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 6,
  },
  subtitle: {
    color: '#888888',
    fontSize: 14,
    letterSpacing: 2,
  },
  statusLine: {
    color: '#a0e0c0',
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginTop: 8,
  },
});

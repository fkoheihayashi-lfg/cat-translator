import { Audio } from 'expo-av';
import { recordingFileExists } from './recordingStorage';

// Central asset registry — require() paths must be static string literals for Metro.
export const SOUND_MAP: Record<string, any> = {
  love:    require('../../assets/sounds/nyan_love.wav'),
  cute:    require('../../assets/sounds/nyan_cute.wav'),
  food:    require('../../assets/sounds/nyan_food.wav'),
  play:    require('../../assets/sounds/nyan_play.wav'),
  sleep:   require('../../assets/sounds/nyan_sleep.mp3'),
  lonely:  require('../../assets/sounds/nyan_lonely.wav'),
  no:      require('../../assets/sounds/nyan_no.m4a'),
  default: require('../../assets/sounds/nyan_default.wav'),
};

let activeSound: Audio.Sound | null = null;
let soundLoading = false;

async function stopActive(): Promise<void> {
  if (activeSound) {
    await activeSound.stopAsync().catch(() => {});
    await activeSound.unloadAsync().catch(() => {});
    activeSound = null;
  }
}

export async function playSoundFromUri(uri: string, fallbackKey?: string): Promise<boolean> {
  if (!uri) {
    if (fallbackKey) await playSound(fallbackKey);
    return false;
  }

  if (soundLoading) return false;

  try {
    const exists = await recordingFileExists(uri);
    if (!exists) {
      if (fallbackKey) await playSound(fallbackKey);
      return false;
    }

    soundLoading = true;
    await stopActive();
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundLoading = false;
    activeSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) activeSound = null;
        sound.unloadAsync().catch(() => {});
      }
    });
    return true;
  } catch {
    soundLoading = false;
    if (fallbackKey) await playSound(fallbackKey);
    return false;
  }
}

export async function playLoggedCatSound(
  options: {
    recordingUri?: string;
    fallbackSoundKey: string;
    allowSyntheticFallback?: boolean;
  }
): Promise<boolean> {
  const {
    recordingUri,
    fallbackSoundKey,
    allowSyntheticFallback = true,
  } = options;

  if (recordingUri) {
    return playSoundFromUri(
      recordingUri,
      allowSyntheticFallback ? fallbackSoundKey : undefined
    );
  }

  if (allowSyntheticFallback) {
    await playSound(fallbackSoundKey);
  }
  return false;
}

export async function playSound(soundKey: string): Promise<void> {
  if (soundLoading) return;
  try {
    soundLoading = true;
    await stopActive();
    const { sound } = await Audio.Sound.createAsync(
      SOUND_MAP[soundKey] ?? SOUND_MAP['default']
    );
    soundLoading = false;
    activeSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) {
          activeSound = null;
        }
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    soundLoading = false;
  }
}

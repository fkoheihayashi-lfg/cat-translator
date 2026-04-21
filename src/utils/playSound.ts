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

async function stopActive(): Promise<void> {
  if (activeSound) {
    await activeSound.stopAsync().catch(() => {});
    await activeSound.unloadAsync().catch(() => {});
    activeSound = null;
  }
}

export async function playSoundFromUri(uri: string, fallbackKey?: string): Promise<boolean> {
  try {
    const exists = await recordingFileExists(uri);
    if (!exists) {
      if (fallbackKey) await playSound(fallbackKey);
      return false;
    }

    await stopActive();
    const { sound } = await Audio.Sound.createAsync({ uri });
    activeSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) activeSound = null;
        sound.unloadAsync();
      }
    });
    return true;
  } catch {
    if (fallbackKey) await playSound(fallbackKey);
    return false;
  }
}

export async function playLoggedCatSound(
  recordingUri: string | undefined,
  fallbackSoundKey: string
): Promise<boolean> {
  if (recordingUri) {
    return playSoundFromUri(recordingUri, fallbackSoundKey);
  }

  await playSound(fallbackSoundKey);
  return false;
}

export async function playSound(soundKey: string): Promise<void> {
  try {
    await stopActive();
    const { sound } = await Audio.Sound.createAsync(
      SOUND_MAP[soundKey] ?? SOUND_MAP['default']
    );
    activeSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) {
          activeSound = null;
        }
        sound.unloadAsync();
      }
    });
  } catch {
    // silently ignore playback errors
  }
}

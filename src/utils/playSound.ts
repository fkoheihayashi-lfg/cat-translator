import { Audio } from 'expo-av';

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

export async function playSound(soundKey: string): Promise<void> {
  try {
    if (activeSound) {
      await activeSound.stopAsync().catch(() => {});
      await activeSound.unloadAsync().catch(() => {});
      activeSound = null;
    }

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

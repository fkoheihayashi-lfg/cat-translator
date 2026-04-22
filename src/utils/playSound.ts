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
let soundLoadingStartedAt = 0;

const SOUND_LOCK_TIMEOUT_MS = 8000;
const SOUND_OP_TIMEOUT_MS = 5000;

function resetSoundLock(): void {
  soundLoading = false;
  soundLoadingStartedAt = 0;
}

function beginSoundLoad(): boolean {
  if (!soundLoading) {
    soundLoading = true;
    soundLoadingStartedAt = Date.now();
    return true;
  }

  if (Date.now() - soundLoadingStartedAt > SOUND_LOCK_TIMEOUT_MS) {
    resetSoundLock();
    soundLoading = true;
    soundLoadingStartedAt = Date.now();
    return true;
  }

  return false;
}

async function ensurePlaybackMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  }).catch(() => {});
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Audio operation timed out'));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

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

  if (!beginSoundLoad()) return false;

  try {
    const exists = await recordingFileExists(uri);
    if (!exists) {
      if (fallbackKey) await playSound(fallbackKey);
      return false;
    }

    await ensurePlaybackMode();
    await stopActive();
    const { sound } = await withTimeout(
      Audio.Sound.createAsync({ uri }),
      SOUND_OP_TIMEOUT_MS
    );
    activeSound = sound;
    await withTimeout(sound.playAsync(), SOUND_OP_TIMEOUT_MS);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) activeSound = null;
        sound.unloadAsync().catch(() => {});
      }
    });
    return true;
  } catch {
    await stopActive();
    if (fallbackKey) await playSound(fallbackKey);
    return false;
  } finally {
    resetSoundLock();
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
  if (!beginSoundLoad()) return;
  try {
    await ensurePlaybackMode();
    await stopActive();
    const asset = SOUND_MAP[soundKey] ?? SOUND_MAP['default'];
    const { sound } = await withTimeout(
      Audio.Sound.createAsync(asset),
      SOUND_OP_TIMEOUT_MS
    );
    activeSound = sound;
    await withTimeout(sound.playAsync(), SOUND_OP_TIMEOUT_MS);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) {
          activeSound = null;
        }
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    await stopActive();
  } finally {
    resetSoundLock();
  }
}

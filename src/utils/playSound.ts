import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
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
const MIN_PLAYBACK_VOLUME = 0.72;
const MAX_PLAYBACK_VOLUME = 1.0;

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
    const sound = activeSound;
    activeSound = null;
    sound.setOnPlaybackStatusUpdate(null);
    await withTimeout(sound.stopAsync(), SOUND_OP_TIMEOUT_MS).catch(() => {});
    await withTimeout(sound.unloadAsync(), SOUND_OP_TIMEOUT_MS).catch(() => {});
  }
}

async function releaseSound(sound: Audio.Sound): Promise<void> {
  sound.setOnPlaybackStatusUpdate(null);
  await withTimeout(sound.unloadAsync(), SOUND_OP_TIMEOUT_MS).catch(() => {});
  if (activeSound === sound) {
    activeSound = null;
  }
}

function clampVolume(value: number): number {
  return Math.max(MIN_PLAYBACK_VOLUME, Math.min(MAX_PLAYBACK_VOLUME, value));
}

async function estimatePlaybackVolume(
  sound: Audio.Sound,
  source?: { uri?: string }
): Promise<number> {
  const status = await sound.getStatusAsync().catch(() => null);
  const durationMs =
    status && status.isLoaded && typeof status.durationMillis === 'number'
      ? status.durationMillis
      : 0;

  let volume = 0.9;

  if (durationMs > 0) {
    if (durationMs < 900) volume += 0.07;
    else if (durationMs > 5000) volume -= 0.06;
  }

  if (source?.uri) {
    const info = await FileSystem.getInfoAsync(source.uri).catch(() => null);
    const byteSize = info && info.exists && typeof info.size === 'number' ? info.size : 0;

    if (byteSize > 0 && durationMs > 0) {
      const bytesPerSecond = byteSize / Math.max(durationMs / 1000, 0.1);
      if (bytesPerSecond < 12000) volume += 0.06;
      else if (bytesPerSecond > 32000) volume -= 0.05;
    }
  }

  return clampVolume(volume);
}

async function applyPlaybackNormalization(
  sound: Audio.Sound,
  source?: { uri?: string }
): Promise<void> {
  const volume = await estimatePlaybackVolume(sound, source);
  await sound.setVolumeAsync(volume).catch(() => {});
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
    await applyPlaybackNormalization(sound, { uri });
    await withTimeout(sound.playAsync(), SOUND_OP_TIMEOUT_MS);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void releaseSound(sound);
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
    await applyPlaybackNormalization(sound);
    await withTimeout(sound.playAsync(), SOUND_OP_TIMEOUT_MS);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void releaseSound(sound);
      }
    });
  } catch {
    await stopActive();
    await ensurePlaybackMode();
  } finally {
    resetSoundLock();
  }
}

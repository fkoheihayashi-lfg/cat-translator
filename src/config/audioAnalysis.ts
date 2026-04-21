declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export type AudioAnalysisProvider = 'mock' | 'server';
export const AUDIO_ANALYSIS_PORT = 5001;
export const AUDIO_ANALYSIS_HEALTH_PATH = '/health';
export const AUDIO_ANALYSIS_ENDPOINT_PATH = '/analyze-audio';
export const AUDIO_ANALYSIS_FILE_FIELD = 'audio';

const env = typeof process !== 'undefined' ? process?.env ?? {} : {};

function getProvider(): AudioAnalysisProvider {
  return env.EXPO_PUBLIC_AUDIO_ANALYSIS_PROVIDER === 'server' ? 'server' : 'mock';
}

function getServerUrl(): string {
  const raw = env.EXPO_PUBLIC_AUDIO_ANALYSIS_URL?.trim();
  return raw && raw.length > 0
    ? raw.replace(/\/+$/, '')
    : `http://127.0.0.1:${AUDIO_ANALYSIS_PORT}`;
}

function getTimeoutMs(): number {
  const raw = Number(env.EXPO_PUBLIC_AUDIO_ANALYSIS_TIMEOUT_MS);
  if (Number.isFinite(raw) && raw >= 1000) return raw;
  return 6000;
}

export const AUDIO_ANALYSIS_CONFIG = {
  provider: getProvider(),
  // App/server contract lives here and in `server/app.py`.
  // Default is intentionally simulator-friendly.
  // Real devices usually need your Mac's LAN IP, for example:
  // http://192.168.1.23:5001
  serverUrl: getServerUrl(),
  timeoutMs: getTimeoutMs(),
} as const;

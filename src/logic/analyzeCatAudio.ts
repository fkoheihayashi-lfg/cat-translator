import { CatAvatarProps } from '../components/CatAvatar';

// Replace this file's internals when wiring in YAMNet / a real audio model.
// The screen should only rely on the normalized CatInterpretation shape.

export type CatInterpretation = {
  mood: string;
  catSubtitle: string;
  translatedText: string;
  soundKey: string;
  source: 'mock' | 'ai';
  inputMode: 'recording' | 'text';
};

export type AnalyzeCatAudioInput = {
  recordingUri?: string;
};

type MockInterpretationSeed = Pick<
  CatInterpretation,
  'mood' | 'catSubtitle' | 'translatedText'
>;

export const MOOD_SOUND: Record<string, string> = {
  '甘え': 'love',
  '要求': 'food',
  '不満': 'no',
  '興味': 'play',
  '安心': 'sleep',
};

export const MOOD_AVATAR: Record<string, CatAvatarProps['mood']> = {
  '甘え': 'happy',
  '要求': 'hungry',
  '不満': 'upset',
  '興味': 'curious',
  '安心': 'sleepy',
};

const MOCK_RESULTS: MockInterpretationSeed[] = [
  { mood: '甘え', catSubtitle: 'にゃぁ…', translatedText: 'ねえ、ちょっと構ってほしいんだけど。' },
  { mood: '要求', catSubtitle: 'にゃー！', translatedText: 'ごはんのこと、そろそろ思い出してくれた？' },
  { mood: '不満', catSubtitle: 'むぅにゃ', translatedText: '今はあんまり触られたい気分じゃないかも。' },
  { mood: '興味', catSubtitle: 'みゃ？', translatedText: 'それなに？ちょっと気になる。' },
  { mood: '安心', catSubtitle: 'ごろ…にゃ', translatedText: 'うん、いまは落ち着いてるよ。' },
];

function normalizeMockInterpretation(seed: MockInterpretationSeed): CatInterpretation {
  return {
    ...seed,
    soundKey: MOOD_SOUND[seed.mood] ?? 'default',
    source: 'mock',
    inputMode: 'recording',
  };
}

export function getAvatarMoodFromInterpretation(
  interpretation: Pick<CatInterpretation, 'mood'>
): CatAvatarProps['mood'] {
  return MOOD_AVATAR[interpretation.mood] ?? 'neutral';
}

// Swap this function body for real audio model inference when ready.
export function analyzeCatAudioMock(): CatInterpretation {
  const seed = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
  return normalizeMockInterpretation(seed);
}

// Future swap point:
// Keep TranslateScreen calling this entry point and replace the internals with
// YAMNet or another audio model implementation later.
export async function analyzeCatAudio(
  _input: AnalyzeCatAudioInput = {}
): Promise<CatInterpretation> {
  return analyzeCatAudioMock();
}

export type CatResult = CatInterpretation;

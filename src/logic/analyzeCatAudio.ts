import { CatAvatarProps } from '../components/CatAvatar';
import {
  CatPersonaState,
  CatProfileLike,
  createSeed,
  pickBySeed,
} from './catPersona';

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
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
};

type MockInterpretationSeed = {
  mood: string;
  catSubtitleOptions: string[];
  translatedTextOptions: string[];
};

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
  {
    mood: '甘え',
    catSubtitleOptions: ['にゃぁ…', 'みゅ…', 'にゃ…♡'],
    translatedTextOptions: [
      'ねえ、ちょっと構ってほしいんだけど。',
      'いまは近くに来てほしい気分みたい。',
      '少し甘えたい気分で呼んでいるみたい。',
    ],
  },
  {
    mood: '要求',
    catSubtitleOptions: ['にゃー！', 'みゃーっ！', 'にゃっにゃっ！'],
    translatedTextOptions: [
      'ごはんのこと、そろそろ思い出してくれた？',
      '今ははっきり何かを求めているみたい。',
      '期待して待っている気配が強いです。',
    ],
  },
  {
    mood: '不満',
    catSubtitleOptions: ['むぅにゃ', 'ふんにゃ', 'にゃっ'],
    translatedTextOptions: [
      '今はあんまり触られたい気分じゃないかも。',
      '少しだけ距離を置きたいみたい。',
      '気分を立て直したいだけかもしれません。',
    ],
  },
  {
    mood: '興味',
    catSubtitleOptions: ['みゃ？', 'にゃ？', 'みゅっ'],
    translatedTextOptions: [
      'それなに？ちょっと気になる。',
      '様子を見ながら興味を向けているみたい。',
      '次に何が起こるか気にしていそうです。',
    ],
  },
  {
    mood: '安心',
    catSubtitleOptions: ['ごろ…にゃ', 'ふぅ…', 'ごろごろ…'],
    translatedTextOptions: [
      'うん、いまは落ち着いてるよ。',
      'かなり気持ちがゆるんでいるみたい。',
      'この場を安心できる場所として受け取っていそうです。',
    ],
  },
];

function normalizeMockInterpretation(seed: {
  mood: string;
  catSubtitle: string;
  translatedText: string;
}): CatInterpretation {
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

function buildMoodPool(personaState?: CatPersonaState): string[] {
  const weights: Record<string, number> = {
    甘え: 1,
    要求: 1,
    不満: 1,
    興味: 1,
    安心: 1,
  };

  if (!personaState) {
    return Object.keys(weights);
  }

  if (personaState.dominantTheme === 'affection' || personaState.dominantTheme === 'comfort') {
    weights['甘え'] += 2;
    weights['安心'] += 1;
  }
  if (personaState.dominantTheme === 'food') {
    weights['要求'] += 3;
  }
  if (personaState.dominantTheme === 'play' || personaState.dominantTheme === 'curiosity') {
    weights['興味'] += 3;
  }
  if (personaState.dominantTheme === 'discipline') {
    weights['不満'] += 2;
  }
  if (personaState.dominantTheme === 'rest') {
    weights['安心'] += 2;
  }

  if (personaState.personalityTone === 'clingy') {
    weights['甘え'] += 1;
    weights['安心'] += 1;
  }
  if (personaState.personalityTone === 'reserved') {
    weights['不満'] += 1;
    weights['興味'] += 1;
  }
  if (personaState.personalityTone === 'playful') {
    weights['興味'] += 1;
  }

  if (personaState.recentMoodTrend && weights[personaState.recentMoodTrend] !== undefined) {
    weights[personaState.recentMoodTrend] += 1;
  }
  personaState.dominantRecentThemes.forEach((theme) => {
    if (theme === 'affection' || theme === 'comfort') weights['甘え'] += 1;
    if (theme === 'food') weights['要求'] += 1;
    if (theme === 'play' || theme === 'curiosity') weights['興味'] += 1;
    if (theme === 'rest') weights['安心'] += 1;
  });

  return Object.entries(weights).flatMap(([mood, weight]) => Array.from({ length: weight }, () => mood));
}

function buildInterpretationTail(
  mood: string,
  input: AnalyzeCatAudioInput,
  seed: number
): string {
  const personaState = input.personaState;
  if (!personaState || personaState.interactionCount === 0) return '';

  const namePrefix = input.profile?.name ? `${input.profile.name}は、` : '';

  if (mood === '甘え' && personaState.relationshipStage === 'attached') {
    return personaState.personalityTone === 'reserved'
      ? `${namePrefix}少しだけ近くに来てほしいのかもしれません。`
      : `${namePrefix}かなり安心して甘えてきているみたい。`;
  }
  if (mood === '要求' && personaState.topicCounts.food >= 2) {
    return `${namePrefix}ごはんの流れをかなり覚えていそうです。`;
  }
  if (mood === '興味' && personaState.topicCounts.play >= 2) {
    return `${namePrefix}いつもの遊びの気配を探しているみたい。`;
  }
  if (mood === '安心' && personaState.topicCounts.affection >= 2) {
    return `${namePrefix}このやり取りにかなり慣れてきているようです。`;
  }
  if (mood === '不満' && personaState.personalityTone === 'reserved') {
    return `${namePrefix}少しだけ一人の時間がほしいのかもしれません。`;
  }
  if (mood === '甘え' && personaState.recentDirectionTrend === 'human_led') {
    return `${namePrefix}最近よく話しかけてもらえる流れを覚えていて、応えようとしていそうです。`;
  }
  if (mood === '興味' && personaState.dominantRecentThemes.includes('play')) {
    return `${namePrefix}最近の遊びの流れを期待している気配があります。`;
  }

  const relationshipTail: Record<CatPersonaState['personalityTone'], string[]> = {
    clingy: ['かなり信頼して声を出しているみたい。'],
    steady: ['いつもの通信だと認識していそうです。'],
    reserved: ['控えめだけど、反応は返してくれているみたい。'],
    playful: ['反応しながら次の刺激も待っていそうです。'],
  };

  return pickBySeed(relationshipTail[personaState.personalityTone], seed);
}

// Swap this function body for real audio model inference when ready.
export function analyzeCatAudioMock(input: AnalyzeCatAudioInput = {}): CatInterpretation {
  const personaState = input.personaState;
  const moodPool = buildMoodPool(personaState);
  const moodSeed = createSeed(
    input.recordingUri ?? 'mock',
    personaState?.interactionCount ?? 0,
    personaState?.dominantTheme ?? 'general',
    input.profile?.personality ?? 'default'
  );
  const selectedMood = pickBySeed(moodPool, moodSeed);
  const seed = MOCK_RESULTS.find((item) => item.mood === selectedMood) ?? MOCK_RESULTS[0];
  const baseText = pickBySeed(
    seed.translatedTextOptions,
    createSeed(moodSeed, selectedMood, personaState?.recentMoodTrend ?? '')
  );
  const tail = buildInterpretationTail(selectedMood, input, moodSeed);
  const translatedText = tail && !baseText.includes(tail) ? `${baseText} ${tail}` : baseText;

  return normalizeMockInterpretation({
    mood: selectedMood,
    catSubtitle: pickBySeed(seed.catSubtitleOptions, createSeed(moodSeed, 'subtitle')),
    translatedText,
  });
}

// Future swap point:
// Keep TranslateScreen calling this entry point and replace the internals with
// YAMNet or another audio model implementation later.
export async function analyzeCatAudio(
  input: AnalyzeCatAudioInput = {}
): Promise<CatInterpretation> {
  return analyzeCatAudioMock(input);
}

export type CatResult = CatInterpretation;

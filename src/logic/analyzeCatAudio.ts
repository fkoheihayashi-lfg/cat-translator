import { CatAvatarProps } from '../components/CatAvatar';
import {
  AUDIO_ANALYSIS_CONFIG,
  AUDIO_ANALYSIS_ENDPOINT_PATH,
  AUDIO_ANALYSIS_FILE_FIELD,
  AUDIO_ANALYSIS_HEALTH_PATH,
} from '../config/audioAnalysis';
import { AppLanguage } from '../i18n/strings';
import {
  CatPersonaState,
  CatProfileLike,
  createSeed,
  pickBySeed,
} from './catPersona';

export type CatInterpretation = {
  mood: string;
  catSubtitle: string;
  translatedText: string;
  soundKey: string;
  source: 'mock' | 'ai' | 'yamnet_server';
  inputMode: 'recording' | 'text';
};

export type AnalyzeCatAudioInput = {
  recordingUri?: string;
  language?: AppLanguage;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
};

type MockInterpretationSeed = {
  mood: string;
  catSubtitleOptions: string[];
  translatedTextOptions: string[];
};

type AudioSignalScores = {
  meow_presence: number;
  animal_vocalization: number;
  vocalization_presence?: number;
};

type YAMNetServerResponse = {
  ok: boolean;
  source: 'yamnet_server';
  scores: AudioSignalScores;
  signalSummary: {
    hasCatLikeVocalization: boolean;
    confidence: number;
  };
  notes: string[];
  error?: string;
};

type ServerFallbackReason =
  | 'missing_recording_uri'
  | 'network_failure'
  | 'bad_status'
  | 'invalid_payload';

type ServerHealthResponse = {
  ok: boolean;
  source: 'yamnet_server';
  service: 'yamnet_server';
  health: 'ok';
  modelLoaded: boolean;
  loadError: string | null;
};

export type AudioAnalysisBridgeStatus = {
  provider: 'mock' | 'server';
  reachable: boolean;
  usingServer: boolean;
  targetUrl: string | null;
  health: 'ok' | 'unreachable' | 'mock_only';
};

declare const __DEV__: boolean | undefined;

const DEV_AUDIO_LOG = typeof __DEV__ !== 'undefined' && __DEV__;

export const MOOD_SOUND: Record<string, string> = {
  甘え: 'love',
  要求: 'food',
  不満: 'no',
  興味: 'play',
  安心: 'sleep',
};

export const MOOD_AVATAR: Record<string, CatAvatarProps['mood']> = {
  甘え: 'happy',
  要求: 'hungry',
  不満: 'upset',
  興味: 'curious',
  安心: 'sleepy',
};

function logAudioAnalysisDev(event: string, payload?: Record<string, unknown>): void {
  if (!DEV_AUDIO_LOG) return;

  if (payload) {
    console.info(`[audio-analysis] ${event}`, payload);
    return;
  }

  console.info(`[audio-analysis] ${event}`);
}

const MOCK_RESULTS: Record<AppLanguage, MockInterpretationSeed[]> = {
  ja: [
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
  ],
  en: [
    {
      mood: '甘え',
      catSubtitleOptions: ['mew...', 'mrr...', 'meow... <3'],
      translatedTextOptions: [
        'Sounds like they want you nearby.',
        'A soft call. Probably looking to be close.',
        'Could be asking for a little attention.',
      ],
    },
    {
      mood: '要求',
      catSubtitleOptions: ['meoow!', 'mraow!', 'meow-meow!'],
      translatedTextOptions: [
        'Sounds like they want something. Food, probably.',
        'Something is expected here. Soon.',
        'Strong waiting energy. Not sure what, but something.',
      ],
    },
    {
      mood: '不満',
      catSubtitleOptions: ['mrrh.', 'huff-meow.', 'meh.'],
      translatedTextOptions: [
        'Might want a bit of space right now.',
        'Slight irritation. Nothing too serious, probably.',
        'Brief pushback. It will pass.',
      ],
    },
    {
      mood: '興味',
      catSubtitleOptions: ['mew?', 'mrrp?', 'prrp?'],
      translatedTextOptions: [
        'Something caught their attention.',
        'Watching. Waiting to see what happens next.',
        'A small spark of interest.',
      ],
    },
    {
      mood: '安心',
      catSubtitleOptions: ['purr...', 'mrr...', 'prrr...'],
      translatedTextOptions: [
        'Fairly settled. Comfortable, it seems.',
        'Calm and comfortable.',
        'Feels safe here, probably.',
      ],
    },
  ],
};

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

function normalizeServerInterpretation(seed: {
  mood: string;
  catSubtitle: string;
  translatedText: string;
}): CatInterpretation {
  return {
    ...seed,
    soundKey: MOOD_SOUND[seed.mood] ?? 'default',
    source: 'yamnet_server',
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

  return Object.entries(weights).flatMap(([mood, weight]) =>
    Array.from({ length: weight }, () => mood)
  );
}

function buildInterpretationTail(
  mood: string,
  input: AnalyzeCatAudioInput,
  seed: number,
  language: AppLanguage
): string {
  const personaState = input.personaState;
  if (!personaState || personaState.interactionCount === 0) return '';

  const name = input.profile?.name;

  if (language === 'ja') {
    const namePrefix = name ? `${name}は、` : '';

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

  const named = name ? `${name} ` : 'Your cat ';

  if (mood === '甘え' && personaState.relationshipStage === 'attached') {
    return personaState.personalityTone === 'reserved'
      ? `${named}might want you a little closer than usual.`
      : `Very comfortable. Probably looking for closeness.`;
  }
  if (mood === '要求' && personaState.topicCounts.food >= 2) {
    return `Feels like the usual food rhythm is on their mind.`;
  }
  if (mood === '興味' && personaState.topicCounts.play >= 2) {
    return `Could be looking for the usual play routine.`;
  }
  if (mood === '安心' && personaState.topicCounts.affection >= 2) {
    return `Feels familiar in a good way.`;
  }
  if (mood === '不満' && personaState.personalityTone === 'reserved') {
    return `${named}may just want a little quiet time.`;
  }
  if (mood === '甘え' && personaState.recentDirectionTrend === 'human_led') {
    return `Maybe answering all that recent attention.`;
  }
  if (mood === '興味' && personaState.dominantRecentThemes.includes('play')) {
    return `Could be expecting that recent play pattern.`;
  }

  const relationshipTail: Record<CatPersonaState['personalityTone'], string[]> = {
    clingy: ['A trusting little call.'],
    steady: ['Feels like a familiar exchange.'],
    reserved: ['Held back, but still engaged.'],
    playful: ['Alert. Maybe waiting for what comes next.'],
  };

  return pickBySeed(relationshipTail[personaState.personalityTone], seed);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

type ServerConfidenceBand = 'very_weak' | 'weak' | 'moderate' | 'strong';
type ServerSignalFlavor = 'close' | 'expectant' | 'alert' | 'settled';

type ServerInterpretationProfile = {
  band: ServerConfidenceBand;
  flavor: ServerSignalFlavor;
  mood: string;
  confidence: number;
};

function getServerConfidenceBand(confidence: number): ServerConfidenceBand {
  if (confidence < 0.18) return 'very_weak';
  if (confidence < 0.34) return 'weak';
  if (confidence < 0.62) return 'moderate';
  return 'strong';
}

function pickHighestMood(scores: Record<string, number>): string {
  let bestMood = '安心';
  let bestScore = Number.NEGATIVE_INFINITY;

  Object.entries(scores).forEach(([mood, score]) => {
    if (score > bestScore) {
      bestMood = mood;
      bestScore = score;
    }
  });

  return bestMood;
}

function deriveServerInterpretationProfile(
  input: AnalyzeCatAudioInput,
  response: YAMNetServerResponse
): ServerInterpretationProfile {
  const personaState = input.personaState;
  const confidence = clamp01(response.signalSummary.confidence);
  const band = getServerConfidenceBand(confidence);
  const meow = clamp01(response.scores.meow_presence);
  const animal = clamp01(response.scores.animal_vocalization);
  const vocal = clamp01(response.scores.vocalization_presence ?? 0);

  if (band === 'very_weak') {
    return {
      band,
      flavor: personaState?.dominantTheme === 'play' ? 'alert' : 'settled',
      mood: '安心',
      confidence,
    };
  }

  const closenessScore =
    meow * 1.35 +
    vocal * 0.55 +
    (personaState?.dominantTheme === 'affection' ? 0.2 : 0) +
    (personaState?.dominantTheme === 'comfort' ? 0.18 : 0) +
    (personaState?.personalityTone === 'clingy' ? 0.12 : 0) +
    (personaState?.relationshipStage === 'attached' ? 0.08 : 0);

  const expectantScore =
    meow * 0.8 +
    vocal * 0.75 +
    animal * 0.35 +
    (personaState?.dominantTheme === 'food' ? 0.28 : 0) +
    (personaState?.recentDirectionTrend === 'human_led' ? 0.08 : 0);

  const alertScore =
    animal * 1.0 +
    vocal * 0.65 +
    meow * 0.4 +
    (personaState?.dominantTheme === 'play' ? 0.22 : 0) +
    (personaState?.dominantTheme === 'curiosity' ? 0.22 : 0) +
    (personaState?.personalityTone === 'playful' ? 0.1 : 0);

  const settledScore =
    0.24 +
    (1 - confidence) * 0.45 +
    (personaState?.dominantTheme === 'rest' ? 0.18 : 0) +
    (personaState?.recentMoodTrend === '安心' ? 0.08 : 0) +
    (personaState?.topicCounts.affection && personaState.topicCounts.affection >= 2 ? 0.05 : 0);

  const restrainedScore =
    animal * 0.55 +
    vocal * 0.35 +
    (1 - meow) * 0.2 +
    (personaState?.dominantTheme === 'discipline' ? 0.2 : 0) +
    (personaState?.personalityTone === 'reserved' ? 0.1 : 0);

  const moodScores: Record<string, number> = {
    甘え: closenessScore,
    要求: band === 'weak' ? expectantScore - 0.12 : expectantScore,
    興味: alertScore,
    安心: settledScore,
    不満:
      band === 'strong' || (band === 'moderate' && restrainedScore > 0.72)
        ? restrainedScore
        : -1,
  };

  const mood = pickHighestMood(moodScores);
  const flavorMap: Record<string, ServerSignalFlavor> = {
    甘え: 'close',
    要求: 'expectant',
    興味: 'alert',
    不満: 'alert',
    安心: 'settled',
  };

  return {
    band,
    flavor: flavorMap[mood] ?? 'settled',
    mood,
    confidence,
  };
}

function pickServerSubtitle(
  language: AppLanguage,
  profile: ServerInterpretationProfile,
  seed: number
): string {
  const energetic = profile.band === 'strong';
  const subtitleMap: Record<AppLanguage, Record<string, string[]>> = {
    ja: {
      甘え: energetic ? ['にゃぁ…', 'みゅぅ…', 'にゃ…'] : ['みゅ…', 'ふにゃ…', 'にゃ…'],
      要求: energetic ? ['にゃー！', 'みゃーっ！', 'にゃっ！'] : ['にゃ…', 'みゃ…', 'にゃ？'],
      不満: ['むぅ…', 'ふんにゃ', 'にゃっ'],
      興味: ['みゃ？', 'にゃ？', 'みゅっ'],
      安心: ['ふぅ…', 'ごろ…', 'ごろごろ…'],
    },
    en: {
      甘え: energetic ? ['mew...', 'mrr...', 'meow...'] : ['mrr...', 'mew...', 'prrp...'],
      要求: energetic ? ['meoow!', 'mraow!', 'meow!'] : ['mew?', 'mrr?', 'meow...'],
      不満: ['mrrh.', 'huff.', 'meh.'],
      興味: ['mew?', 'mrrp?', 'prrp?'],
      安心: ['purr...', 'mrr...', 'prrr...'],
    },
  };

  return pickBySeed(subtitleMap[language][profile.mood] ?? subtitleMap[language]['安心'], seed);
}

function pickServerBaseTemplates(
  language: AppLanguage,
  profile: ServerInterpretationProfile
): string[] {
  if (language === 'ja') {
    const map: Record<ServerConfidenceBand, Record<ServerSignalFlavor, string[]>> = {
      very_weak: {
        close: [
          '猫らしい声かどうかはかなり控えめです。小さく呼んだだけか、環境音まじりかもしれません。',
          '信号はかなり弱めです。ほんの短い反応だけ拾っている可能性があります。',
        ],
        expectant: [
          '猫らしい声かどうかはかなり控えめです。何かの気配に反応しただけかもしれません。',
          '信号はかなり弱めです。小さく声を出した可能性はありますが、はっきりとは読み切れません。',
        ],
        alert: [
          '猫らしい声かどうかはかなり控えめです。周りの音にまぎれた短い反応かもしれません。',
          '信号はかなり弱めです。ちょっと気を向けた程度の声の可能性があります。',
        ],
        settled: [
          '猫らしい声かどうかはかなり控えめです。小さな反応か、環境音まじりかもしれません。',
          '信号はかなり弱めです。今のところ強い意図までは読み取れません。',
        ],
      },
      weak: {
        close: [
          '弱めですが、猫らしい声の気配はあります。そっと近さを求める呼びかけにも聞こえます。',
          'うっすら猫らしい発声があります。小さく気持ちを向けた声かもしれません。',
        ],
        expectant: [
          '弱めですが、猫らしい発声の気配はあります。何かを待ちながら呼んだ声にも聞こえます。',
          'うっすら猫らしい声があります。軽く期待を向けた呼びかけかもしれません。',
        ],
        alert: [
          '弱めですが、猫らしい発声の気配はあります。ちょっと注意を向けた短い声かもしれません。',
          'うっすら猫らしい声があります。何かに気づいた反応にも聞こえます。',
        ],
        settled: [
          '弱めですが、猫らしい発声の気配はあります。小さな返事のようにも聞こえます。',
          'うっすら猫らしい声があります。今のところは穏やかな反応寄りです。',
        ],
      },
      moderate: {
        close: [
          '猫らしい発声がそこそこありそうです。やわらかく気持ちを向けた声に聞こえます。',
          '猫らしい声はわりとありそうです。近くに来てほしい時の呼びかけにも聞こえます。',
        ],
        expectant: [
          '猫らしい発声がそこそこありそうです。何かを待ちながら呼んでいる声に聞こえます。',
          '猫らしい声はわりとありそうです。少し期待をのせた呼びかけにも聞こえます。',
        ],
        alert: [
          '猫らしい発声がそこそこありそうです。何かに気づいた時の短い声に聞こえます。',
          '猫らしい声はわりとありそうです。注意が動いた時の反応に近そうです。',
        ],
        settled: [
          '猫らしい発声がそこそこありそうです。今は比較的落ち着いた反応に聞こえます。',
          '猫らしい声はわりとありそうです。強い主張というより、軽い返事寄りです。',
        ],
      },
      strong: {
        close: [
          '猫らしい発声はかなりありそうです。親しさのある呼びかけに聞こえます。',
          '猫らしい声はかなり強めです。気持ちを近く向けた声に聞こえます。',
        ],
        expectant: [
          '猫らしい発声はかなりありそうです。何かを期待している時の呼びかけに聞こえます。',
          '猫らしい声はかなり強めです。待っているものがありそうな呼びかけです。',
        ],
        alert: [
          '猫らしい発声はかなりありそうです。注意がはっきり動いた時の声に聞こえます。',
          '猫らしい声はかなり強めです。何かに反応して呼んだ時の声に近そうです。',
        ],
        settled: [
          '猫らしい発声はかなりありそうです。強すぎないけれど、はっきりした返事に聞こえます。',
          '猫らしい声はかなり強めです。落ち着きのある呼びかけにも聞こえます。',
        ],
      },
    };

    return map[profile.band][profile.flavor];
  }

  const map: Record<ServerConfidenceBand, Record<ServerSignalFlavor, string[]>> = {
    very_weak: {
      close: [
        'Very faint. Could be a tiny call, or just mixed room sound.',
        'Only a light trace here. Might be a small little response.',
      ],
      expectant: [
        'Very faint. Could be a small call, but it is hard to read clearly.',
        'Only a light trace here. Maybe a brief reaction to something expected.',
      ],
      alert: [
        'Very faint. Could be a quick little reaction, or just mixed sound.',
        'Only a light trace here. Maybe something briefly caught their attention.',
      ],
      settled: [
        'Very faint. Could be a small response, or just mixed room sound.',
        'Only a light trace here. Nothing strong enough to read clearly.',
      ],
    },
    weak: {
      close: [
        'A faint cat-like trace is there. Sounds soft, maybe a little close.',
        'There may be a cat-like call here. Feels gentle more than urgent.',
      ],
      expectant: [
        'A faint cat-like trace is there. Maybe a small call with a bit of expectation.',
        'There may be a cat-like call here. Sounds like they could be waiting on something.',
      ],
      alert: [
        'A faint cat-like trace is there. Maybe a quick call after noticing something.',
        'There may be a cat-like call here. Feels more alert than settled.',
      ],
      settled: [
        'A faint cat-like trace is there. Could just be a quiet little answer.',
        'There may be a cat-like call here. Nothing especially strong, just present.',
      ],
    },
    moderate: {
      close: [
        'There is a decent cat-like signal here. Sounds soft and a little close.',
        'The cat-like signal is fairly present. Feels like a gentle call for closeness.',
      ],
      expectant: [
        'There is a decent cat-like signal here. Sounds a bit like they are waiting on something.',
        'The cat-like signal is fairly present. Feels a little expectant.',
      ],
      alert: [
        'There is a decent cat-like signal here. Something may have caught their attention.',
        'The cat-like signal is fairly present. Feels like a quick alert response.',
      ],
      settled: [
        'There is a decent cat-like signal here. Feels more settled than urgent.',
        'The cat-like signal is fairly present. More like a calm reply than a strong demand.',
      ],
    },
    strong: {
      close: [
        'The cat-like signal is pretty strong here. Sounds warm and close.',
        'There is a strong cat-like call here. Feels like a clear reach for closeness.',
      ],
      expectant: [
        'The cat-like signal is pretty strong here. Sounds like they are waiting on something.',
        'There is a strong cat-like call here. Feels openly expectant.',
      ],
      alert: [
        'The cat-like signal is pretty strong here. Something clearly caught their attention.',
        'There is a strong cat-like call here. Feels like a quick alert reaction.',
      ],
      settled: [
        'The cat-like signal is pretty strong here. Still feels fairly calm.',
        'There is a strong cat-like call here. More clear than urgent.',
      ],
    },
  };

  return map[profile.band][profile.flavor];
}

function buildServerContextTail(
  input: AnalyzeCatAudioInput,
  profile: ServerInterpretationProfile,
  seed: number,
  language: AppLanguage
): string {
  const personaState = input.personaState;
  if (!personaState || personaState.interactionCount === 0) return '';

  const name = input.profile?.name;
  const band = profile.band;
  const mood = profile.mood;

  if (language === 'ja') {
    const namePrefix = name ? `${name}は、` : '';

    if (band === 'very_weak') {
      const veryWeakOptions = personaState.personalityTone === 'reserved'
        ? ['まだ小さな反応の範囲かもしれません。', '控えめな返事だけ拾っている可能性があります。']
        : ['今はほんの少し気持ちが動いた程度かもしれません。', '小さく存在を返してくれたくらいかもしれません。'];
      return pickBySeed(veryWeakOptions, seed);
    }

    if (mood === '甘え' && personaState.relationshipStage === 'attached') {
      return personaState.personalityTone === 'reserved'
        ? `${namePrefix}控えめだけど、少し近くに来てほしいのかもしれません。`
        : `${namePrefix}安心して距離を縮めたい時の声に少し近いです。`;
    }
    if (mood === '要求' && personaState.topicCounts.food >= 2) {
      return `${namePrefix}いつものごはんやおやつの流れを思い出していそうです。`;
    }
    if (mood === '興味' && personaState.topicCounts.play >= 2) {
      return `${namePrefix}最近の遊びの流れに気持ちが向いているのかもしれません。`;
    }
    if (mood === '安心' && personaState.topicCounts.affection >= 2) {
      return `${namePrefix}このやり取り自体にはかなり慣れていそうです。`;
    }
    if (mood === '不満' && personaState.personalityTone === 'reserved') {
      return `${namePrefix}少しだけ静かにしていたい時の反応かもしれません。`;
    }
    if (mood === '甘え' && personaState.recentDirectionTrend === 'human_led') {
      return `${namePrefix}最近よく話しかけてもらえる流れに応えている気配もあります。`;
    }
    if (mood === '興味' && personaState.dominantRecentThemes.includes('play')) {
      return `${namePrefix}次の刺激を少し待っている気配もあります。`;
    }

    const tailMap: Record<CatPersonaState['personalityTone'], Record<ServerConfidenceBand, string[]>> = {
      clingy: {
        very_weak: [''],
        weak: ['少し甘えを混ぜた声にも聞こえます。'],
        moderate: ['気持ちを近く向けた反応に見えます。'],
        strong: ['かなり信頼のある呼びかけ寄りです。'],
      },
      steady: {
        very_weak: [''],
        weak: ['いつものやり取りの延長にある反応かもしれません。'],
        moderate: ['今の空気に自然に反応している感じです。'],
        strong: ['かなりはっきり気持ちを向けてきているようです。'],
      },
      reserved: {
        very_weak: [''],
        weak: ['控えめだけど、気持ちは向けていそうです。'],
        moderate: ['抑えめでも、ちゃんと反応は返していそうです。'],
        strong: ['控えめなタイプとしては、かなりはっきりめです。'],
      },
      playful: {
        very_weak: [''],
        weak: ['少しだけ気分が動いた時の声かもしれません。'],
        moderate: ['次の動きを待ちながら反応している感じです。'],
        strong: ['かなり気持ちが前に出ている時の声に近いです。'],
      },
    };

    return pickBySeed(tailMap[personaState.personalityTone][band], seed);
  }

  if (band === 'very_weak') {
    const veryWeakOptions = personaState.personalityTone === 'reserved'
      ? ['Could just be a held-back little response.', 'Maybe only the edge of a response came through.']
      : ['Maybe just a tiny shift in mood.', 'Could simply be a small little answer.'];
    return pickBySeed(veryWeakOptions, seed);
  }

  if (mood === '甘え' && personaState.relationshipStage === 'attached') {
    return personaState.personalityTone === 'reserved'
      ? `${name ?? 'They'} might just want you a bit closer.`
      : 'Feels like a comfortable little reach for closeness.';
  }
  if (mood === '要求' && personaState.topicCounts.food >= 2) {
    return 'Could be leaning on the usual food rhythm a bit.';
  }
  if (mood === '興味' && personaState.topicCounts.play >= 2) {
    return 'Could be tied to that familiar play pattern.';
  }
  if (mood === '安心' && personaState.topicCounts.affection >= 2) {
    return 'This exchange itself may already feel familiar.';
  }
  if (mood === '不満' && personaState.personalityTone === 'reserved') {
    return 'Maybe just wanting a little quiet space.';
  }
  if (mood === '甘え' && personaState.recentDirectionTrend === 'human_led') {
    return 'Possibly answering all that recent attention.';
  }
  if (mood === '興味' && personaState.dominantRecentThemes.includes('play')) {
    return 'Could be waiting for the next bit of action.';
  }

  const tailMap: Record<CatPersonaState['personalityTone'], Record<ServerConfidenceBand, string[]>> = {
    clingy: {
      very_weak: [''],
      weak: ['A little soft around the edges.'],
      moderate: ['Feels gently affectionate.'],
      strong: ['A clear little reach outward.'],
    },
    steady: {
      very_weak: [''],
      weak: ['Feels like part of the usual back-and-forth.'],
      moderate: ['Feels natural in the moment.'],
      strong: ['A fairly clear response.'],
    },
    reserved: {
      very_weak: [''],
      weak: ['Held back, but still there.'],
      moderate: ['Quiet, but engaged.'],
      strong: ['For a restrained mood, this is fairly clear.'],
    },
    playful: {
      very_weak: [''],
      weak: ['Maybe just a small spark of interest.'],
      moderate: ['Feels ready for something next.'],
      strong: ['Quite forward for a playful moment.'],
    },
  };

  return pickBySeed(tailMap[personaState.personalityTone][band], seed);
}

function buildServerInterpretation(
  input: AnalyzeCatAudioInput,
  response: YAMNetServerResponse
): CatInterpretation {
  const language = input.language ?? 'ja';
  const profile = deriveServerInterpretationProfile(input, response);
  const seed = createSeed(
    input.recordingUri ?? 'server',
    response.source,
    profile.mood,
    profile.band,
    profile.flavor,
    profile.confidence,
    response.scores.meow_presence,
    response.scores.animal_vocalization
  );
  const baseText = pickBySeed(pickServerBaseTemplates(language, profile), seed);
  const tail = buildServerContextTail(input, profile, seed, language);
  const translatedText = tail && !baseText.includes(tail) ? `${baseText} ${tail}` : baseText;

  return normalizeServerInterpretation({
    mood: profile.mood,
    catSubtitle: pickServerSubtitle(language, profile, seed),
    translatedText,
  });
}

function buildMultipartAudio(uri: string): FormData {
  const formData = new FormData();
  const fileName = uri.split('/').pop() ?? 'cat-audio.m4a';
  const type = fileName.endsWith('.wav')
    ? 'audio/wav'
    : fileName.endsWith('.mp3')
      ? 'audio/mpeg'
      : fileName.endsWith('.caf')
        ? 'audio/x-caf'
        : 'audio/mp4';

  formData.append(AUDIO_ANALYSIS_FILE_FIELD, {
    uri,
    name: fileName,
    type,
  } as never);

  return formData;
}

export function getAudioAnalysisBridgeDebugLabel(
  status: AudioAnalysisBridgeStatus | null
): string {
  if (!__DEV__) return '';
  if (status === null) return 'AUDIO BRIDGE · CHECKING';
  if (status.provider === 'mock') return 'AUDIO BRIDGE · MOCK MODE';
  return status.reachable
    ? 'AUDIO BRIDGE · SERVER REACHABLE'
    : 'AUDIO BRIDGE · SERVER DOWN · MOCK FALLBACK';
}

async function analyzeCatAudioServer(
  input: AnalyzeCatAudioInput
): Promise<CatInterpretation> {
  if (!input.recordingUri) {
    throw new Error('missing_recording_uri');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIO_ANALYSIS_CONFIG.timeoutMs);

  try {
    logAudioAnalysisDev('server_request_started', {
      targetUrl: `${AUDIO_ANALYSIS_CONFIG.serverUrl}${AUDIO_ANALYSIS_ENDPOINT_PATH}`,
      provider: AUDIO_ANALYSIS_CONFIG.provider,
    });

    let response: Response;
    try {
      response = await fetch(
        `${AUDIO_ANALYSIS_CONFIG.serverUrl}${AUDIO_ANALYSIS_ENDPOINT_PATH}`,
        {
          method: 'POST',
          body: buildMultipartAudio(input.recordingUri),
          signal: controller.signal,
        }
      );
    } catch {
      throw new Error('network_failure');
    }

    let data: Partial<YAMNetServerResponse>;
    try {
      data = (await response.json()) as Partial<YAMNetServerResponse>;
    } catch {
      throw new Error('invalid_payload');
    }

    if (
      !response.ok ||
      !data.ok ||
      data.source !== 'yamnet_server' ||
      !data.scores ||
      !data.signalSummary
    ) {
      throw new Error(response.ok ? 'invalid_payload' : 'bad_status');
    }

    logAudioAnalysisDev('server_request_succeeded', {
      source: data.source,
      confidence: data.signalSummary?.confidence,
    });

    return buildServerInterpretation(input, data as YAMNetServerResponse);
  } finally {
    clearTimeout(timeoutId);
  }
}

function shouldUseServerAnalysis(input: AnalyzeCatAudioInput): boolean {
  return AUDIO_ANALYSIS_CONFIG.provider === 'server' && Boolean(input.recordingUri);
}

function fallbackToMock(
  input: AnalyzeCatAudioInput,
  reason: ServerFallbackReason
): CatInterpretation {
  logAudioAnalysisDev('fallback_to_mock', {
    reason,
    provider: AUDIO_ANALYSIS_CONFIG.provider,
  });
  return analyzeCatAudioMock(input);
}

function getFallbackReason(error: unknown): ServerFallbackReason {
  if (!(error instanceof Error)) return 'network_failure';
  if (error.message === 'missing_recording_uri') return 'missing_recording_uri';
  if (error.message === 'bad_status') return 'bad_status';
  if (error.message === 'invalid_payload') return 'invalid_payload';
  return 'network_failure';
}

export function analyzeCatAudioMock(input: AnalyzeCatAudioInput = {}): CatInterpretation {
  const language = input.language ?? 'ja';
  const personaState = input.personaState;
  const moodPool = buildMoodPool(personaState);
  const moodSeed = createSeed(
    input.recordingUri ?? 'mock',
    language,
    personaState?.interactionCount ?? 0,
    personaState?.dominantTheme ?? 'general',
    input.profile?.personality ?? 'default'
  );
  const selectedMood = pickBySeed(moodPool, moodSeed);
  const resultSeed = MOCK_RESULTS[language].find((item) => item.mood === selectedMood) ?? MOCK_RESULTS[language][0];
  const baseText = pickBySeed(
    resultSeed.translatedTextOptions,
    createSeed(moodSeed, selectedMood, personaState?.recentMoodTrend ?? '')
  );
  const tail = buildInterpretationTail(selectedMood, input, moodSeed, language);
  const translatedText = tail && !baseText.includes(tail) ? `${baseText} ${tail}` : baseText;

  return normalizeMockInterpretation({
    mood: selectedMood,
    catSubtitle: pickBySeed(resultSeed.catSubtitleOptions, createSeed(moodSeed, 'subtitle')),
    translatedText,
  });
}

export async function checkAudioAnalysisBridgeStatus(): Promise<AudioAnalysisBridgeStatus> {
  if (AUDIO_ANALYSIS_CONFIG.provider !== 'server') {
    return {
      provider: AUDIO_ANALYSIS_CONFIG.provider,
      reachable: false,
      usingServer: false,
      targetUrl: null,
      health: 'mock_only',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.min(2500, AUDIO_ANALYSIS_CONFIG.timeoutMs));

  try {
    const targetUrl = `${AUDIO_ANALYSIS_CONFIG.serverUrl}${AUDIO_ANALYSIS_HEALTH_PATH}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    const data = (await response.json()) as Partial<ServerHealthResponse>;
    const reachable =
      response.ok &&
      data.ok === true &&
      data.source === 'yamnet_server' &&
      data.health === 'ok';

    logAudioAnalysisDev('health_check_completed', {
      targetUrl,
      reachable,
      modelLoaded: data.modelLoaded,
      loadError: data.loadError ?? null,
    });

    return {
      provider: AUDIO_ANALYSIS_CONFIG.provider,
      reachable,
      usingServer: reachable,
      targetUrl,
      health: reachable ? 'ok' : 'unreachable',
    };
  } catch {
    const targetUrl = `${AUDIO_ANALYSIS_CONFIG.serverUrl}${AUDIO_ANALYSIS_HEALTH_PATH}`;
    logAudioAnalysisDev('health_check_failed', { targetUrl });
    return {
      provider: AUDIO_ANALYSIS_CONFIG.provider,
      reachable: false,
      usingServer: false,
      targetUrl,
      health: 'unreachable',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function analyzeCatAudio(
  input: AnalyzeCatAudioInput = {}
): Promise<CatInterpretation> {
  logAudioAnalysisDev('analysis_requested', {
    provider: AUDIO_ANALYSIS_CONFIG.provider,
    hasRecordingUri: Boolean(input.recordingUri),
  });

  if (shouldUseServerAnalysis(input)) {
    try {
      return await analyzeCatAudioServer(input);
    } catch (error) {
      return fallbackToMock(input, getFallbackReason(error));
    }
  }

  return analyzeCatAudioMock(input);
}

export type CatResult = CatInterpretation;

import { CatAvatarProps } from '../components/CatAvatar';
import {
  AUDIO_ANALYSIS_CONFIG,
  AUDIO_ANALYSIS_ENDPOINT_PATH,
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
      ? `${named}may want you a little closer than usual.`
      : `${named}sounds very comfortable asking for closeness.`;
  }
  if (mood === '要求' && personaState.topicCounts.food >= 2) {
    return `${named}seems to remember the usual food rhythm.`;
  }
  if (mood === '興味' && personaState.topicCounts.play >= 2) {
    return `${named}may be looking for the usual play routine.`;
  }
  if (mood === '安心' && personaState.topicCounts.affection >= 2) {
    return `${named}sounds used to this exchange in a good way.`;
  }
  if (mood === '不満' && personaState.personalityTone === 'reserved') {
    return `${named}may just want a little quiet time.`;
  }
  if (mood === '甘え' && personaState.recentDirectionTrend === 'human_led') {
    return `${named}may be responding to all the recent attention.`;
  }
  if (mood === '興味' && personaState.dominantRecentThemes.includes('play')) {
    return `${named}seems to expect the play pattern you have had lately.`;
  }

  const relationshipTail: Record<CatPersonaState['personalityTone'], string[]> = {
    clingy: ['There is a strong trust signal in the way your cat is vocalizing.'],
    steady: ['This sounds like a familiar exchange to your cat.'],
    reserved: ['The response is restrained, but still engaged.'],
    playful: ['Your cat sounds alert and ready for more stimulation.'],
  };

  return pickBySeed(relationshipTail[personaState.personalityTone], seed);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function pickServerMood(
  input: AnalyzeCatAudioInput,
  response: YAMNetServerResponse
): string {
  const personaState = input.personaState;
  const confidence = clamp01(response.signalSummary.confidence);

  if (confidence < 0.18) return '安心';
  if (personaState?.dominantTheme === 'food' && confidence >= 0.45) return '要求';
  if (personaState?.dominantTheme === 'play' || personaState?.dominantTheme === 'curiosity') {
    return confidence >= 0.42 ? '興味' : '安心';
  }
  if (personaState?.dominantTheme === 'discipline' && confidence < 0.3) return '不満';
  if (personaState?.dominantTheme === 'affection' || personaState?.dominantTheme === 'comfort') {
    return confidence >= 0.35 ? '甘え' : '安心';
  }
  if (response.scores.meow_presence >= 0.52) return '甘え';
  if (response.scores.animal_vocalization >= 0.4) return '興味';
  return confidence >= 0.28 ? '興味' : '安心';
}

function pickServerSubtitle(
  language: AppLanguage,
  mood: string,
  confidence: number,
  seed: number
): string {
  const highEnergy = confidence >= 0.55;
  const subtitleMap: Record<AppLanguage, Record<string, string[]>> = {
    ja: {
      甘え: highEnergy ? ['にゃぁ…', 'みゅぅ…', 'にゃ…'] : ['みゅ…', 'にゃ…', 'ふにゃ…'],
      要求: highEnergy ? ['にゃー！', 'みゃーっ！', 'にゃっ！'] : ['にゃ…', 'みゃ…', 'にゃ？'],
      不満: ['むぅ…', 'ふんにゃ', 'にゃっ'],
      興味: ['みゃ？', 'にゃ？', 'みゅっ'],
      安心: ['ふぅ…', 'ごろ…', 'ごろごろ…'],
    },
    en: {
      甘え: highEnergy ? ['mew...', 'mrr...', 'meow...'] : ['mrr...', 'mew...', 'prrp...'],
      要求: highEnergy ? ['meoow!', 'mraow!', 'meow!'] : ['mew?', 'mrr?', 'meow...'],
      不満: ['mrrh.', 'huff.', 'meh.'],
      興味: ['mew?', 'mrrp?', 'prrp?'],
      安心: ['purr...', 'mrr...', 'prrr...'],
    },
  };

  return pickBySeed(subtitleMap[language][mood] ?? subtitleMap[language]['安心'], seed);
}

function buildServerBaseText(
  language: AppLanguage,
  confidence: number,
  response: YAMNetServerResponse,
  mood: string
): string {
  const weakCatLike = response.signalSummary.hasCatLikeVocalization;

  if (language === 'ja') {
    if (!weakCatLike || confidence < 0.18) {
      return '猫らしい声の信号は弱めです。小さな反応か、環境音まじりかもしれません。';
    }
    if (confidence >= 0.62) {
      if (mood === '要求') return '猫らしい発声はかなりありそうです。何かを伝えようとしている声に聞こえます。';
      if (mood === '甘え') return '猫らしい発声はかなりありそうです。近さを求める呼びかけにも聞こえます。';
      if (mood === '興味') return '猫らしい発声はかなりありそうです。注意を向けた短い呼びかけに聞こえます。';
      return '猫らしい発声はかなりありそうです。落ち着いた反応にも聞こえます。';
    }
    if (confidence >= 0.34) {
      return '猫らしい発声が少しありそうです。軽く気持ちを向けた声かもしれません。';
    }
    return '弱めですが、猫らしい発声の気配はあります。はっきりした意図までは断定できません。';
  }

  if (!weakCatLike || confidence < 0.18) {
    return 'The cat-like signal is fairly weak. This may be a small response or mixed ambient audio.';
  }
  if (confidence >= 0.62) {
    if (mood === '要求') return 'There is a fairly strong cat-like vocal signal here. It sounds like your cat is trying to ask for something.';
    if (mood === '甘え') return 'There is a fairly strong cat-like vocal signal here. It sounds a bit like a call for closeness.';
    if (mood === '興味') return 'There is a fairly strong cat-like vocal signal here. It sounds like a short attention-seeking call.';
    return 'There is a fairly strong cat-like vocal signal here. It may be a calm response.';
  }
  if (confidence >= 0.34) {
    return 'There is some cat-like vocal signal here. It may be a light attempt to get your attention.';
  }
  return 'The signal is faint, but there may still be a cat-like vocal trace. It is too soft to read as a strong intent.';
}

function buildServerInterpretation(
  input: AnalyzeCatAudioInput,
  response: YAMNetServerResponse
): CatInterpretation {
  const language = input.language ?? 'ja';
  const confidence = clamp01(response.signalSummary.confidence);
  const mood = pickServerMood(input, response);
  const seed = createSeed(
    input.recordingUri ?? 'server',
    response.source,
    mood,
    confidence,
    response.scores.meow_presence,
    response.scores.animal_vocalization
  );
  const baseText = buildServerBaseText(language, confidence, response, mood);
  const tail = buildInterpretationTail(mood, input, seed, language);
  const translatedText = tail && !baseText.includes(tail) ? `${baseText} ${tail}` : baseText;

  return normalizeServerInterpretation({
    mood,
    catSubtitle: pickServerSubtitle(language, mood, confidence, seed),
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

  formData.append('audio', {
    uri,
    name: fileName,
    type,
  } as never);

  return formData;
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
  _reason: ServerFallbackReason
): CatInterpretation {
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

export async function analyzeCatAudio(
  input: AnalyzeCatAudioInput = {}
): Promise<CatInterpretation> {
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

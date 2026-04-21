import { CatAvatarProps } from '../components/CatAvatar';
import {
  CatPersonaState,
  CatProfileLike,
  createSeed,
  InteractionTheme,
  LogEntryLike,
} from './catPersona';

// Keep SpeakScreen calling only generateCatReply().
// Swap the implementation inside that entry point when wiring in Claude later.

export type CatReply = {
  catSound: string;    // phonetic cat sound shown large in the card
  responseText: string; // cat's reply in Japanese
  soundKey: string;    // key into SOUND_MAP
  mood: string;        // mood label forwarded to LogEntry
};

export type GenerateCatReplyInput = {
  text: string;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
  log?: LogEntryLike[];
};

export const SOUND_AVATAR: Record<string, CatAvatarProps['mood']> = {
  love:    'happy',
  cute:    'happy',
  food:    'hungry',
  play:    'curious',
  sleep:   'sleepy',
  lonely:  'upset',
  no:      'upset',
  default: 'neutral',
};

// ─── Internal types ───────────────────────────────────────────────────────────

type Variant = Omit<CatReply, never>;

type Category = {
  theme: InteractionTheme;
  pattern: RegExp;
  variants: Variant[];
};

// ─── Response table ───────────────────────────────────────────────────────────
// Each category has 3–4 variants so repeated inputs feel less robotic.
// Keep responses short, cat-like, and believable. Avoid jokes.

const CATEGORIES: Category[] = [
  {
    theme: 'affection',
    pattern: /好き|大好き|愛してる/,
    variants: [
      { catSound: 'にゃぁ…♡',  responseText: '…うれしいにゃ。もっと言ってほしいにゃ。',    soundKey: 'love', mood: '甘え' },
      { catSound: 'ふにゃぁ…',  responseText: 'なんかくすぐったいにゃ…。',                soundKey: 'love', mood: '甘え' },
      { catSound: 'みゅぅ…',   responseText: 'もっとそばにいてほしいにゃ。',              soundKey: 'love', mood: '甘え' },
      { catSound: 'にゃ…♡',   responseText: '…ちゃんと聞こえてるにゃ。',               soundKey: 'love', mood: '甘え' },
    ],
  },
  {
    theme: 'affection',
    pattern: /かわいい|きれい|美人/,
    variants: [
      { catSound: 'ふにゃ',    responseText: 'わかってるにゃ。でも、もっと言うにゃ。',     soundKey: 'cute', mood: '甘え' },
      { catSound: 'にゃ…♡',   responseText: 'そうにゃ。わかってるにゃ。',               soundKey: 'cute', mood: '甘え' },
      { catSound: 'むにゃ',    responseText: 'まあ、そうかもにゃ。',                    soundKey: 'cute', mood: '甘え' },
    ],
  },
  {
    theme: 'affection',
    pattern: /えらい|すごい|じょうず|上手|天才/,
    variants: [
      { catSound: 'にゃ…？',   responseText: 'そうにゃ。わかればいいにゃ。',             soundKey: 'cute', mood: '甘え' },
      { catSound: 'ふにゃ♡',   responseText: 'もっとほめていいにゃ。',                  soundKey: 'cute', mood: '甘え' },
      { catSound: 'みゅぅ',    responseText: 'まあ、そうかもにゃ。',                    soundKey: 'cute', mood: '甘え' },
    ],
  },
  {
    theme: 'food',
    pattern: /ごはん|ご飯|食べ|おなか|めし|えさ|フード/,
    variants: [
      { catSound: 'にゃーっ！',  responseText: 'はやくするにゃ！待ってるにゃ！',            soundKey: 'food', mood: '要求' },
      { catSound: 'にゃあっ！',  responseText: 'もうずっと待ってたにゃ。',                soundKey: 'food', mood: '要求' },
      { catSound: 'みゃーっ！',  responseText: 'おなかすいてるにゃ、はやくにゃ。',          soundKey: 'food', mood: '要求' },
      { catSound: 'にゃっにゃっ！', responseText: 'そのにおい、わかるにゃ。はやくにゃ。',   soundKey: 'food', mood: '要求' },
    ],
  },
  {
    theme: 'food',
    pattern: /おやつ|ちゅーる|おいし/,
    variants: [
      { catSound: 'にゃぁっ！',  responseText: 'それにゃ！それがほしいにゃ！',             soundKey: 'food', mood: '要求' },
      { catSound: 'みゅっ！',   responseText: 'においでわかるにゃ。はやくにゃ。',          soundKey: 'food', mood: '要求' },
      { catSound: 'にゃーっ！',  responseText: 'ずっと待ってたにゃ。',                   soundKey: 'food', mood: '要求' },
    ],
  },
  {
    theme: 'play',
    pattern: /遊|あそ|遊ぼ|ぼーる|ねこじゃらし/,
    variants: [
      { catSound: 'みゃっ！',   responseText: 'いいにゃ！今すぐ来るにゃ！',              soundKey: 'play', mood: '興味' },
      { catSound: 'にゃっにゃっ！', responseText: 'まってたにゃ！何で遊ぶにゃ！',          soundKey: 'play', mood: '興味' },
      { catSound: 'みゅっ！',   responseText: 'ちょっと準備するにゃ。',                 soundKey: 'play', mood: '興味' },
      { catSound: 'にゃ！',    responseText: 'そっちに行くにゃ。待ってにゃ。',            soundKey: 'play', mood: '興味' },
    ],
  },
  {
    theme: 'comfort',
    pattern: /なで|もふ|さわ|タッチ|ふれ|触/,
    variants: [
      { catSound: 'ごろごろ…',  responseText: 'そこそこにゃ…。きもちいいにゃ。',          soundKey: 'cute', mood: '安心' },
      { catSound: 'にゃぁ…',   responseText: 'もうちょっとにゃ…。',                    soundKey: 'cute', mood: '安心' },
      { catSound: 'ふにゃ…',   responseText: 'そこじゃないにゃ。もうちょっと上にゃ。',     soundKey: 'cute', mood: '安心' },
      { catSound: 'むぅ…',    responseText: 'いまはそんな気分じゃないにゃ。',            soundKey: 'no',   mood: '不満' },
    ],
  },
  {
    theme: 'rest',
    pattern: /ねむ|眠|寝よ|おやすみ|ねんね/,
    variants: [
      { catSound: 'ごろ…にゃ',  responseText: '…いっしょに寝るにゃ。あったかいにゃ。',     soundKey: 'sleep', mood: '安心' },
      { catSound: 'にゃ…zzz',  responseText: 'もうねむいにゃ…。',                     soundKey: 'sleep', mood: '安心' },
      { catSound: 'ふぅ…にゃ',  responseText: 'そばにいてくれるにゃ？',                 soundKey: 'sleep', mood: '安心' },
      { catSound: 'ごろごろ…',  responseText: 'あたたかいにゃ。このままがいいにゃ。',      soundKey: 'sleep', mood: '安心' },
    ],
  },
  {
    theme: 'comfort',
    pattern: /どこ|いない|さびし|寂し|ひとり/,
    variants: [
      { catSound: 'にゃ…？',   responseText: 'ちゃんとここにいるにゃ。心配しなくていいにゃ。', soundKey: 'lonely', mood: '甘え' },
      { catSound: 'にゃあ…',   responseText: 'どこにも行ってないにゃ。',                soundKey: 'lonely', mood: '甘え' },
      { catSound: 'みゅ…',    responseText: 'ずっとそばにいるにゃ。',                  soundKey: 'lonely', mood: '甘え' },
    ],
  },
  {
    theme: 'discipline',
    pattern: /だめ|ダメ|やめ|こら|いけない|怒/,
    variants: [
      { catSound: 'むにゃ',    responseText: '…別にいいじゃないにゃ。',                 soundKey: 'no', mood: '不満' },
      { catSound: 'ふんにゃ',   responseText: 'うるさいにゃ。',                        soundKey: 'no', mood: '不満' },
      { catSound: 'にゃっ',    responseText: '知らないにゃ。',                         soundKey: 'no', mood: '不満' },
      { catSound: 'むぅにゃ',   responseText: 'そんなこと言われても困るにゃ。',            soundKey: 'no', mood: '不満' },
    ],
  },
];

const DEFAULT_VARIANTS: Variant[] = [
  { catSound: 'にゃ',    responseText: '…なんか言ってるにゃ。よくわからないにゃ。', soundKey: 'default', mood: '' },
  { catSound: 'にゃ…',   responseText: 'ふーん、そうにゃ。',                   soundKey: 'default', mood: '' },
  { catSound: 'みゅ',    responseText: '…ちょっとよくわからないにゃ。',           soundKey: 'default', mood: '' },
  { catSound: 'にゃ？',   responseText: 'どういうことにゃ？',                   soundKey: 'default', mood: '' },
];

const PERSONALITY_MEMORY_LINES: Record<
  CatPersonaState['personalityTone'],
  Record<string, string[]>
> = {
  clingy: {
    default: ['もっと近くにいてほしいにゃ。', 'ちゃんと聞いてくれるとうれしいにゃ。'],
    affection: ['最近はすぐ甘えたくなるにゃ。'],
    comfort: ['このやり取り、かなり安心するにゃ。'],
    food: ['その話を聞くと、すぐ期待しちゃうにゃ。'],
  },
  steady: {
    default: ['この感じ、だいぶ慣れてきたにゃ。', 'いつもの流れって感じにゃ。'],
    rest: ['落ち着く時間だって覚えてるにゃ。'],
    comfort: ['ここだと安心していられるにゃ。'],
  },
  reserved: {
    default: ['…悪くないにゃ。', 'それなら聞いてあげるにゃ。'],
    affection: ['…今日は少しだけ近くにいてもいいにゃ。'],
    food: ['その話ならちゃんと反応するにゃ。'],
    comfort: ['ここなら落ち着けるにゃ。'],
  },
  playful: {
    default: ['次は何が来るにゃ？', 'ちょっと気分が乗ってきたにゃ。'],
    play: ['また遊ぶ流れかと思ったにゃ。'],
    curiosity: ['最近は気になるものが増えたにゃ。'],
    affection: ['うれしいと、つい動きたくなるにゃ。'],
  },
};

function getCategory(text: string): { theme: InteractionTheme; variants: Variant[] } {
  for (const category of CATEGORIES) {
    if (category.pattern.test(text)) {
      return { theme: category.theme, variants: category.variants };
    }
  }
  return { theme: 'general', variants: DEFAULT_VARIANTS };
}

function scoreVariant(
  variant: Variant,
  theme: InteractionTheme,
  input: GenerateCatReplyInput,
  seed: number
): number {
  const personaState = input.personaState;
  const personalityTone = personaState?.personalityTone ?? 'steady';
  let score = (createSeed(seed, variant.responseText, variant.catSound) % 13) + 1;
  const length = variant.responseText.length;

  if (personalityTone === 'clingy' && (theme === 'affection' || theme === 'comfort')) {
    score += length;
  }
  if (personalityTone === 'reserved') {
    score += 26 - Math.min(length, 26);
    if (variant.responseText.includes('もっと') || variant.catSound.includes('♡')) score -= 5;
  }
  if (personalityTone === 'playful' && (theme === 'play' || theme === 'curiosity')) {
    score += variant.responseText.includes('！') ? 8 : 4;
  }
  if (personalityTone === 'steady') {
    score += 10 - Math.abs(length - 16);
  }
  if (personaState?.favoriteTopic === theme) {
    score += 5;
  }
  if (personaState?.dominantTheme === theme) {
    score += 3;
  }
  if (personaState?.relationshipStage === 'attached' && theme === 'affection') {
    score += 4;
  }
  if (personaState?.recentDirectionTrend === 'human_led' && theme === 'comfort') {
    score += 2;
  }
  if (personaState?.dominantRecentThemes.includes(theme)) {
    score += 2;
  }

  return score;
}

function buildPersonalizedTail(
  theme: InteractionTheme,
  input: GenerateCatReplyInput,
  seed: number
): string {
  const personaState = input.personaState;
  if (!personaState || personaState.interactionCount === 0) return '';

  const pool = PERSONALITY_MEMORY_LINES[personaState.personalityTone];
  const shouldUseThemeLine =
    personaState.favoriteTopic === theme ||
    personaState.topicCounts[theme] >= 3 ||
    (theme !== 'general' && personaState.dominantTheme === theme);

  const candidates =
    (shouldUseThemeLine ? pool[theme] : undefined) ??
    (personaState.relationshipStage !== 'new' ? pool.default : undefined);

  if (!candidates || candidates.length === 0) return '';
  const picked = candidates[seed % candidates.length];

  if (personaState.recentDirectionTrend === 'human_led' && theme === 'comfort') {
    return picked.includes('安心')
      ? picked
      : `${picked} ちゃんと見てるにゃ。`;
  }

  return picked;
}

function appendTail(base: string, tail: string): string {
  if (!tail || base.includes(tail)) return base;
  return `${base} ${tail}`;
}

function generateCatReplyFromTemplate(input: GenerateCatReplyInput): CatReply {
  const category = getCategory(input.text);
  const personaState = input.personaState;
  const seed = createSeed(
    input.text,
    personaState?.interactionCount ?? 0,
    personaState?.dominantTheme ?? 'general',
    input.profile?.personality ?? 'default'
  );
  const chosen = category.variants.reduce((best, variant) => {
    const bestScore = scoreVariant(best, category.theme, input, seed);
    const currentScore = scoreVariant(variant, category.theme, input, seed);
    return currentScore > bestScore ? variant : best;
  }, category.variants[0]);
  const tail = buildPersonalizedTail(category.theme, input, seed);

  return {
    ...chosen,
    responseText: appendTail(chosen.responseText, tail),
  };
}

// Future swap point:
// Replace the internals of generateCatReply() with a Claude-backed
// implementation while keeping SpeakScreen and the CatReply shape unchanged.
export async function generateCatReply(input: GenerateCatReplyInput): Promise<CatReply> {
  return generateCatReplyFromTemplate(input);
}

export { generateCatReplyFromTemplate };

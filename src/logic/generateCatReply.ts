import { CatAvatarProps } from '../components/CatAvatar';

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
};

type CatReplyGenerator = (input: GenerateCatReplyInput) => Promise<CatReply>;

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
  pattern: RegExp;
  variants: Variant[];
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Response table ───────────────────────────────────────────────────────────
// Each category has 3–4 variants so repeated inputs feel less robotic.
// Keep responses short, cat-like, and believable. Avoid jokes.

const CATEGORIES: Category[] = [
  {
    pattern: /好き|大好き|愛してる/,
    variants: [
      { catSound: 'にゃぁ…♡',  responseText: '…うれしいにゃ。もっと言ってほしいにゃ。',    soundKey: 'love', mood: '甘え' },
      { catSound: 'ふにゃぁ…',  responseText: 'なんかくすぐったいにゃ…。',                soundKey: 'love', mood: '甘え' },
      { catSound: 'みゅぅ…',   responseText: 'もっとそばにいてほしいにゃ。',              soundKey: 'love', mood: '甘え' },
      { catSound: 'にゃ…♡',   responseText: '…ちゃんと聞こえてるにゃ。',               soundKey: 'love', mood: '甘え' },
    ],
  },
  {
    pattern: /かわいい|きれい|美人/,
    variants: [
      { catSound: 'ふにゃ',    responseText: 'わかってるにゃ。でも、もっと言うにゃ。',     soundKey: 'cute', mood: '甘え' },
      { catSound: 'にゃ…♡',   responseText: 'そうにゃ。わかってるにゃ。',               soundKey: 'cute', mood: '甘え' },
      { catSound: 'むにゃ',    responseText: 'まあ、そうかもにゃ。',                    soundKey: 'cute', mood: '甘え' },
    ],
  },
  {
    pattern: /えらい|すごい|じょうず|上手|天才/,
    variants: [
      { catSound: 'にゃ…？',   responseText: 'そうにゃ。わかればいいにゃ。',             soundKey: 'cute', mood: '甘え' },
      { catSound: 'ふにゃ♡',   responseText: 'もっとほめていいにゃ。',                  soundKey: 'cute', mood: '甘え' },
      { catSound: 'みゅぅ',    responseText: 'まあ、そうかもにゃ。',                    soundKey: 'cute', mood: '甘え' },
    ],
  },
  {
    pattern: /ごはん|ご飯|食べ|おなか|めし|えさ|フード/,
    variants: [
      { catSound: 'にゃーっ！',  responseText: 'はやくするにゃ！待ってるにゃ！',            soundKey: 'food', mood: '要求' },
      { catSound: 'にゃあっ！',  responseText: 'もうずっと待ってたにゃ。',                soundKey: 'food', mood: '要求' },
      { catSound: 'みゃーっ！',  responseText: 'おなかすいてるにゃ、はやくにゃ。',          soundKey: 'food', mood: '要求' },
      { catSound: 'にゃっにゃっ！', responseText: 'そのにおい、わかるにゃ。はやくにゃ。',   soundKey: 'food', mood: '要求' },
    ],
  },
  {
    pattern: /おやつ|ちゅーる|おいし/,
    variants: [
      { catSound: 'にゃぁっ！',  responseText: 'それにゃ！それがほしいにゃ！',             soundKey: 'food', mood: '要求' },
      { catSound: 'みゅっ！',   responseText: 'においでわかるにゃ。はやくにゃ。',          soundKey: 'food', mood: '要求' },
      { catSound: 'にゃーっ！',  responseText: 'ずっと待ってたにゃ。',                   soundKey: 'food', mood: '要求' },
    ],
  },
  {
    pattern: /遊|あそ|遊ぼ|ぼーる|ねこじゃらし/,
    variants: [
      { catSound: 'みゃっ！',   responseText: 'いいにゃ！今すぐ来るにゃ！',              soundKey: 'play', mood: '興味' },
      { catSound: 'にゃっにゃっ！', responseText: 'まってたにゃ！何で遊ぶにゃ！',          soundKey: 'play', mood: '興味' },
      { catSound: 'みゅっ！',   responseText: 'ちょっと準備するにゃ。',                 soundKey: 'play', mood: '興味' },
      { catSound: 'にゃ！',    responseText: 'そっちに行くにゃ。待ってにゃ。',            soundKey: 'play', mood: '興味' },
    ],
  },
  {
    pattern: /なで|もふ|さわ|タッチ|ふれ|触/,
    variants: [
      { catSound: 'ごろごろ…',  responseText: 'そこそこにゃ…。きもちいいにゃ。',          soundKey: 'cute', mood: '安心' },
      { catSound: 'にゃぁ…',   responseText: 'もうちょっとにゃ…。',                    soundKey: 'cute', mood: '安心' },
      { catSound: 'ふにゃ…',   responseText: 'そこじゃないにゃ。もうちょっと上にゃ。',     soundKey: 'cute', mood: '安心' },
      { catSound: 'むぅ…',    responseText: 'いまはそんな気分じゃないにゃ。',            soundKey: 'no',   mood: '不満' },
    ],
  },
  {
    pattern: /ねむ|眠|寝よ|おやすみ|ねんね/,
    variants: [
      { catSound: 'ごろ…にゃ',  responseText: '…いっしょに寝るにゃ。あったかいにゃ。',     soundKey: 'sleep', mood: '安心' },
      { catSound: 'にゃ…zzz',  responseText: 'もうねむいにゃ…。',                     soundKey: 'sleep', mood: '安心' },
      { catSound: 'ふぅ…にゃ',  responseText: 'そばにいてくれるにゃ？',                 soundKey: 'sleep', mood: '安心' },
      { catSound: 'ごろごろ…',  responseText: 'あたたかいにゃ。このままがいいにゃ。',      soundKey: 'sleep', mood: '安心' },
    ],
  },
  {
    pattern: /どこ|いない|さびし|寂し|ひとり/,
    variants: [
      { catSound: 'にゃ…？',   responseText: 'ちゃんとここにいるにゃ。心配しなくていいにゃ。', soundKey: 'lonely', mood: '甘え' },
      { catSound: 'にゃあ…',   responseText: 'どこにも行ってないにゃ。',                soundKey: 'lonely', mood: '甘え' },
      { catSound: 'みゅ…',    responseText: 'ずっとそばにいるにゃ。',                  soundKey: 'lonely', mood: '甘え' },
    ],
  },
  {
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

function generateCatReplyFromTemplate(input: string): CatReply {
  for (const category of CATEGORIES) {
    if (category.pattern.test(input)) {
      return pick(category.variants);
    }
  }
  return pick(DEFAULT_VARIANTS);
}

const localCatReplyGenerator: CatReplyGenerator = async ({ text }) => {
  return generateCatReplyFromTemplate(text);
};

// Future swap point:
// Replace localCatReplyGenerator with a Claude-backed implementation while
// keeping SpeakScreen and the CatReply shape unchanged.
export async function generateCatReply(input: GenerateCatReplyInput): Promise<CatReply> {
  return localCatReplyGenerator(input);
}

export { generateCatReplyFromTemplate };

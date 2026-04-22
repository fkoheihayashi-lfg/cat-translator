import { CatAvatarProps } from '../components/CatAvatar';
import { AppLanguage } from '../i18n/strings';
import {
  CatPersonaState,
  CatProfileLike,
  createSeed,
  InteractionTheme,
  LogEntryLike,
} from './catPersona';
import {
  getHumanToCatIntentDefinition,
  HumanToCatIntentId,
} from './humanToCatIntents';

export type CatReply = {
  catSound: string;
  responseText: string;
  soundKey: string;
  mood: string;
  humanIntentId?: HumanToCatIntentId;
};

export type GenerateCatReplyInput = {
  text: string;
  intentId?: HumanToCatIntentId;
  language?: AppLanguage;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
  log?: LogEntryLike[];
};

export const SOUND_AVATAR: Record<string, CatAvatarProps['mood']> = {
  love: 'happy',
  cute: 'happy',
  food: 'hungry',
  play: 'curious',
  sleep: 'sleepy',
  lonely: 'upset',
  no: 'upset',
  default: 'neutral',
};

type Variant = Omit<CatReply, never>;

type Category = {
  theme: InteractionTheme;
  pattern: RegExp;
  variants: Variant[];
};

const CATEGORY_PATTERNS: Record<string, RegExp> = {
  affection_love: /好き|大好き|愛してる|love you|love ya|adore you/i,
  affection_cute: /かわいい|きれい|美人|cute|pretty|adorable|beautiful/i,
  affection_praise: /えらい|すごい|じょうず|上手|天才|smart|good job|amazing|brilliant/i,
  food_meal: /ごはん|ご飯|食べ|おなか|めし|えさ|フード|food|feed|hungry|dinner|breakfast/i,
  food_treat: /おやつ|ちゅーる|おいし|treat|snack|churu|yummy/i,
  play: /遊|あそ|遊ぼ|ぼーる|ねこじゃらし|play|toy|ball|chase|string/i,
  comfort_touch: /なで|もふ|さわ|タッチ|ふれ|触|pet|pat|cuddle|hold/i,
  rest: /ねむ|眠|寝よ|おやすみ|ねんね|sleep|sleepy|nap|rest|bedtime/i,
  comfort_presence: /どこ|いない|さびし|寂し|ひとり|where are you|lonely|miss you|with me|stay here/i,
  discipline: /だめ|ダメ|やめ|こら|いけない|怒|no|stop|bad|don't do that/i,
};

const CATEGORIES: Record<AppLanguage, Category[]> = {
  ja: [
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_love,
      variants: [
        { catSound: 'にゃぁ…♡', responseText: '…うれしいにゃ。もっと言ってほしいにゃ。', soundKey: 'love', mood: '甘え' },
        { catSound: 'ふにゃぁ…', responseText: 'なんかくすぐったいにゃ…。', soundKey: 'love', mood: '甘え' },
        { catSound: 'みゅぅ…', responseText: 'もっとそばにいてほしいにゃ。', soundKey: 'love', mood: '甘え' },
        { catSound: 'にゃ…♡', responseText: '…ちゃんと聞こえてるにゃ。', soundKey: 'love', mood: '甘え' },
      ],
    },
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_cute,
      variants: [
        { catSound: 'ふにゃ', responseText: 'わかってるにゃ。でも、もっと言うにゃ。', soundKey: 'cute', mood: '甘え' },
        { catSound: 'にゃ…♡', responseText: 'そうにゃ。わかってるにゃ。', soundKey: 'cute', mood: '甘え' },
        { catSound: 'むにゃ', responseText: 'まあ、そうかもにゃ。', soundKey: 'cute', mood: '甘え' },
      ],
    },
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_praise,
      variants: [
        { catSound: 'にゃ…？', responseText: 'そうにゃ。わかればいいにゃ。', soundKey: 'cute', mood: '甘え' },
        { catSound: 'ふにゃ♡', responseText: 'もっとほめていいにゃ。', soundKey: 'cute', mood: '甘え' },
        { catSound: 'みゅぅ', responseText: 'まあ、そうかもにゃ。', soundKey: 'cute', mood: '甘え' },
      ],
    },
    {
      theme: 'food',
      pattern: CATEGORY_PATTERNS.food_meal,
      variants: [
        { catSound: 'にゃーっ！', responseText: 'はやくするにゃ！待ってるにゃ！', soundKey: 'food', mood: '要求' },
        { catSound: 'にゃあっ！', responseText: 'もうずっと待ってたにゃ。', soundKey: 'food', mood: '要求' },
        { catSound: 'みゃーっ！', responseText: 'おなかすいてるにゃ、はやくにゃ。', soundKey: 'food', mood: '要求' },
        { catSound: 'にゃっにゃっ！', responseText: 'そのにおい、わかるにゃ。はやくにゃ。', soundKey: 'food', mood: '要求' },
      ],
    },
    {
      theme: 'food',
      pattern: CATEGORY_PATTERNS.food_treat,
      variants: [
        { catSound: 'にゃぁっ！', responseText: 'それにゃ！それがほしいにゃ！', soundKey: 'food', mood: '要求' },
        { catSound: 'みゅっ！', responseText: 'においでわかるにゃ。はやくにゃ。', soundKey: 'food', mood: '要求' },
        { catSound: 'にゃーっ！', responseText: 'ずっと待ってたにゃ。', soundKey: 'food', mood: '要求' },
      ],
    },
    {
      theme: 'play',
      pattern: CATEGORY_PATTERNS.play,
      variants: [
        { catSound: 'みゃっ！', responseText: 'いいにゃ！今すぐ来るにゃ！', soundKey: 'play', mood: '興味' },
        { catSound: 'にゃっにゃっ！', responseText: 'まってたにゃ！何で遊ぶにゃ！', soundKey: 'play', mood: '興味' },
        { catSound: 'みゅっ！', responseText: 'ちょっと準備するにゃ。', soundKey: 'play', mood: '興味' },
        { catSound: 'にゃ！', responseText: 'そっちに行くにゃ。待ってにゃ。', soundKey: 'play', mood: '興味' },
      ],
    },
    {
      theme: 'comfort',
      pattern: CATEGORY_PATTERNS.comfort_touch,
      variants: [
        { catSound: 'ごろごろ…', responseText: 'そこそこにゃ…。きもちいいにゃ。', soundKey: 'cute', mood: '安心' },
        { catSound: 'にゃぁ…', responseText: 'もうちょっとにゃ…。', soundKey: 'cute', mood: '安心' },
        { catSound: 'ふにゃ…', responseText: 'そこじゃないにゃ。もうちょっと上にゃ。', soundKey: 'cute', mood: '安心' },
        { catSound: 'むぅ…', responseText: 'いまはそんな気分じゃないにゃ。', soundKey: 'no', mood: '不満' },
      ],
    },
    {
      theme: 'rest',
      pattern: CATEGORY_PATTERNS.rest,
      variants: [
        { catSound: 'ごろ…にゃ', responseText: '…いっしょに寝るにゃ。あったかいにゃ。', soundKey: 'sleep', mood: '安心' },
        { catSound: 'にゃ…zzz', responseText: 'もうねむいにゃ…。', soundKey: 'sleep', mood: '安心' },
        { catSound: 'ふぅ…にゃ', responseText: 'そばにいてくれるにゃ？', soundKey: 'sleep', mood: '安心' },
        { catSound: 'ごろごろ…', responseText: 'あたたかいにゃ。このままがいいにゃ。', soundKey: 'sleep', mood: '安心' },
      ],
    },
    {
      theme: 'comfort',
      pattern: CATEGORY_PATTERNS.comfort_presence,
      variants: [
        { catSound: 'にゃ…？', responseText: 'ちゃんとここにいるにゃ。心配しなくていいにゃ。', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'にゃあ…', responseText: 'どこにも行ってないにゃ。', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'みゅ…', responseText: 'ずっとそばにいるにゃ。', soundKey: 'lonely', mood: '甘え' },
      ],
    },
    {
      theme: 'discipline',
      pattern: CATEGORY_PATTERNS.discipline,
      variants: [
        { catSound: 'むにゃ', responseText: '…別にいいじゃないにゃ。', soundKey: 'no', mood: '不満' },
        { catSound: 'ふんにゃ', responseText: 'うるさいにゃ。', soundKey: 'no', mood: '不満' },
        { catSound: 'にゃっ', responseText: '知らないにゃ。', soundKey: 'no', mood: '不満' },
        { catSound: 'むぅにゃ', responseText: 'そんなこと言われても困るにゃ。', soundKey: 'no', mood: '不満' },
      ],
    },
  ],
  en: [
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_love,
      variants: [
        { catSound: 'mrrr...', responseText: 'Mmm. Say it again.', soundKey: 'love', mood: '甘え' },
        { catSound: 'mew...', responseText: 'Stay close a little longer.', soundKey: 'love', mood: '甘え' },
        { catSound: 'prrp...', responseText: 'I like hearing that.', soundKey: 'love', mood: '甘え' },
        { catSound: 'meow... <3', responseText: 'I heard you. Come closer.', soundKey: 'love', mood: '甘え' },
      ],
    },
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_cute,
      variants: [
        { catSound: 'mrrp', responseText: 'I know. Keep going.', soundKey: 'cute', mood: '甘え' },
        { catSound: 'meow...', responseText: 'Yes, obviously.', soundKey: 'cute', mood: '甘え' },
        { catSound: 'prr', responseText: 'Maybe a little.', soundKey: 'cute', mood: '甘え' },
      ],
    },
    {
      theme: 'affection',
      pattern: CATEGORY_PATTERNS.affection_praise,
      variants: [
        { catSound: 'mew?', responseText: 'Of course I am.', soundKey: 'cute', mood: '甘え' },
        { catSound: 'prrp!', responseText: 'You can praise me more.', soundKey: 'cute', mood: '甘え' },
        { catSound: 'mrr', responseText: 'That sounds right.', soundKey: 'cute', mood: '甘え' },
      ],
    },
    {
      theme: 'food',
      pattern: CATEGORY_PATTERNS.food_meal,
      variants: [
        { catSound: 'meoow!', responseText: 'About time. Been waiting.', soundKey: 'food', mood: '要求' },
        { catSound: 'mraow!', responseText: 'Yes. Food. Right now.', soundKey: 'food', mood: '要求' },
        { catSound: 'meow-meow!', responseText: 'Hungry. Hurry up.', soundKey: 'food', mood: '要求' },
        { catSound: 'mrrAAow!', responseText: 'I know that sound. Bring it.', soundKey: 'food', mood: '要求' },
      ],
    },
    {
      theme: 'food',
      pattern: CATEGORY_PATTERNS.food_treat,
      variants: [
        { catSound: 'mrrOW!', responseText: 'That one. I want that one.', soundKey: 'food', mood: '要求' },
        { catSound: 'mew!', responseText: 'I can smell it already.', soundKey: 'food', mood: '要求' },
        { catSound: 'meoow!', responseText: 'I was waiting for that.', soundKey: 'food', mood: '要求' },
      ],
    },
    {
      theme: 'play',
      pattern: CATEGORY_PATTERNS.play,
      variants: [
        { catSound: 'prrp!', responseText: 'Good. Now we play.', soundKey: 'play', mood: '興味' },
        { catSound: 'mew-mew!', responseText: 'Finally. What are we chasing?', soundKey: 'play', mood: '興味' },
        { catSound: 'mrrp!', responseText: 'Wait. Getting ready.', soundKey: 'play', mood: '興味' },
        { catSound: 'meow!', responseText: "Coming. Don't start without me.", soundKey: 'play', mood: '興味' },
      ],
    },
    {
      theme: 'comfort',
      pattern: CATEGORY_PATTERNS.comfort_touch,
      variants: [
        { catSound: 'purr...', responseText: 'That spot is nice.', soundKey: 'cute', mood: '安心' },
        { catSound: 'mrr...', responseText: 'A little more.', soundKey: 'cute', mood: '安心' },
        { catSound: 'prrrp', responseText: 'Higher. A little higher.', soundKey: 'cute', mood: '安心' },
        { catSound: 'mrrh.', responseText: 'Not right now.', soundKey: 'no', mood: '不満' },
      ],
    },
    {
      theme: 'rest',
      pattern: CATEGORY_PATTERNS.rest,
      variants: [
        { catSound: 'purr... mew', responseText: 'Sleep here. Warm enough.', soundKey: 'sleep', mood: '安心' },
        { catSound: 'mew... zzz', responseText: 'Sleepy already.', soundKey: 'sleep', mood: '安心' },
        { catSound: 'mrr...', responseText: 'Stay close while I nap.', soundKey: 'sleep', mood: '安心' },
        { catSound: 'purr...', responseText: 'Warm. Staying like this.', soundKey: 'sleep', mood: '安心' },
      ],
    },
    {
      theme: 'comfort',
      pattern: CATEGORY_PATTERNS.comfort_presence,
      variants: [
        { catSound: 'mew?', responseText: 'Right here. Not going anywhere.', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'mrr...', responseText: 'Still here.', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'prrp...', responseText: 'Staying close.', soundKey: 'lonely', mood: '甘え' },
      ],
    },
    {
      theme: 'discipline',
      pattern: CATEGORY_PATTERNS.discipline,
      variants: [
        { catSound: 'mrrh.', responseText: 'Disagree.', soundKey: 'no', mood: '不満' },
        { catSound: 'huff-meow.', responseText: 'Too loud.', soundKey: 'no', mood: '不満' },
        { catSound: 'meh.', responseText: 'Ignoring that.', soundKey: 'no', mood: '不満' },
        { catSound: 'mrrrow.', responseText: "Not my problem.", soundKey: 'no', mood: '不満' },
      ],
    },
  ],
};

const DEFAULT_VARIANTS: Record<AppLanguage, Variant[]> = {
  ja: [
    { catSound: 'にゃ', responseText: '…なんか言ってるにゃ。よくわからないにゃ。', soundKey: 'default', mood: '' },
    { catSound: 'にゃ…', responseText: 'ふーん、そうにゃ。', soundKey: 'default', mood: '' },
    { catSound: 'みゅ', responseText: '…ちょっとよくわからないにゃ。', soundKey: 'default', mood: '' },
    { catSound: 'にゃ？', responseText: 'どういうことにゃ？', soundKey: 'default', mood: '' },
  ],
  en: [
    { catSound: 'mew?', responseText: 'Hmm. Not sure what that means.', soundKey: 'default', mood: '' },
    { catSound: 'mrr...', responseText: 'All right. Go on.', soundKey: 'default', mood: '' },
    { catSound: 'meow?', responseText: 'What do you mean?', soundKey: 'default', mood: '' },
    { catSound: 'prrp?', responseText: 'Not quite clear.', soundKey: 'default', mood: '' },
  ],
};

const PERSONALITY_MEMORY_LINES: Record<
  AppLanguage,
  Record<CatPersonaState['personalityTone'], Record<string, string[]>>
> = {
  ja: {
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
  },
  en: {
    clingy: {
      default: ['Stay a little longer.', 'Keep talking. I like it.'],
      affection: ['Extra close lately.'],
      comfort: ['This feels safe.'],
      food: ['That talk makes me hopeful.'],
    },
    steady: {
      default: ['This feels familiar now.', 'This is our usual rhythm.'],
      rest: ['I know this kind of quiet.'],
      comfort: ['I can settle here.'],
    },
    reserved: {
      default: ['...Not bad.', 'All right. Listening.'],
      affection: ['...You can stay close today.'],
      food: ['I pay attention to that.'],
      comfort: ['Calm enough here.'],
    },
    playful: {
      default: ["What's next?", 'Getting interested now.'],
      play: ['Thought this might turn into play.'],
      curiosity: ['More to inspect lately.'],
      affection: ['When happy, I want to move.'],
    },
  },
};

function getCategory(text: string, language: AppLanguage): { theme: InteractionTheme; variants: Variant[] } {
  for (const category of CATEGORIES[language]) {
    if (category.pattern.test(text)) {
      return { theme: category.theme, variants: category.variants };
    }
  }
  return { theme: 'general', variants: DEFAULT_VARIANTS[language] };
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
    if (variant.responseText.includes('more') || variant.catSound.includes('<3') || variant.catSound.includes('♡')) {
      score -= 5;
    }
  }
  if (personalityTone === 'playful' && (theme === 'play' || theme === 'curiosity')) {
    score += variant.responseText.includes('!') || variant.responseText.includes('！') ? 8 : 4;
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
  seed: number,
  language: AppLanguage
): string {
  const personaState = input.personaState;
  if (!personaState || personaState.interactionCount === 0) return '';

  const pool = PERSONALITY_MEMORY_LINES[language][personaState.personalityTone];
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
    return language === 'ja'
      ? (picked.includes('安心') ? picked : `${picked} ちゃんと見てるにゃ。`)
      : (picked.includes('watch') ? picked : `${picked} Paying attention, too.`);
  }

  return picked;
}

function appendTail(base: string, tail: string): string {
  if (!tail || base.includes(tail)) return base;
  return `${base} ${tail}`;
}

function pickBestVariant(
  variants: Variant[],
  theme: InteractionTheme,
  input: GenerateCatReplyInput,
  seed: number
): Variant {
  return variants.reduce((best, variant) => {
    const bestScore = scoreVariant(best, theme, input, seed);
    const currentScore = scoreVariant(variant, theme, input, seed);
    return currentScore > bestScore ? variant : best;
  }, variants[0]);
}

function generateCatReplyFromIntent(input: GenerateCatReplyInput): CatReply {
  const language = input.language ?? 'ja';
  const intent = getHumanToCatIntentDefinition(input.intentId as HumanToCatIntentId);
  const personaState = input.personaState;
  const seed = createSeed(
    intent.id,
    language,
    personaState?.interactionCount ?? 0,
    personaState?.dominantTheme ?? 'general',
    input.profile?.personality ?? 'default'
  );
  const chosen = pickBestVariant(intent.variants[language], intent.theme, input, seed);
  const tail = buildPersonalizedTail(intent.theme, input, seed, language);

  return {
    ...chosen,
    humanIntentId: intent.id,
    responseText: appendTail(chosen.responseText, tail),
  };
}

function generateCatReplyFromTemplate(input: GenerateCatReplyInput): CatReply {
  const language = input.language ?? 'ja';
  const category = getCategory(input.text, language);
  const personaState = input.personaState;
  const seed = createSeed(
    input.text,
    language,
    personaState?.interactionCount ?? 0,
    personaState?.dominantTheme ?? 'general',
    input.profile?.personality ?? 'default'
  );
  const chosen = pickBestVariant(category.variants, category.theme, input, seed);
  const tail = buildPersonalizedTail(category.theme, input, seed, language);

  return {
    ...chosen,
    responseText: appendTail(chosen.responseText, tail),
  };
}

export async function generateCatReply(input: GenerateCatReplyInput): Promise<CatReply> {
  if (input.intentId) {
    return generateCatReplyFromIntent(input);
  }
  return generateCatReplyFromTemplate(input);
}

export { generateCatReplyFromTemplate };

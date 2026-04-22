import { AppLanguage } from '../i18n/strings';
import { InteractionTheme } from './catPersona';

export type HumanToCatIntentId =
  | 'call'
  | 'calm'
  | 'praise'
  | 'food'
  | 'play'
  | 'stop';

export type HumanToCatIntentVariant = {
  catSound: string;
  responseText: string;
  soundKey: string;
  mood: string;
};

export type HumanToCatIntentDefinition = {
  id: HumanToCatIntentId;
  labelJa: string;
  labelEn: string;
  theme: InteractionTheme;
  variants: Record<AppLanguage, HumanToCatIntentVariant[]>;
};

export const HUMAN_TO_CAT_INTENTS: HumanToCatIntentDefinition[] = [
  {
    id: 'call',
    labelJa: '呼ぶ',
    labelEn: 'Call',
    theme: 'comfort',
    variants: {
      ja: [
        { catSound: 'みゃ？ みゃ？', responseText: 'こっちだよって、やさしく呼んでる感じにゃ。', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'にゃ？', responseText: '近くにおいでって、やわらかく伝えてるにゃ。', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'みゅー', responseText: 'そばに来てほしい空気、ちゃんと出てるにゃ。', soundKey: 'love', mood: '甘え' },
      ],
      en: [
        { catSound: 'mrrp? mrrp?', responseText: 'A gentle call to come closer.', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'mew?', responseText: 'Softly inviting them nearer.', soundKey: 'lonely', mood: '甘え' },
        { catSound: 'prrp...', responseText: 'A calm little come-here cue.', soundKey: 'love', mood: '甘え' },
      ],
    },
  },
  {
    id: 'calm',
    labelJa: '落ち着かせる',
    labelEn: 'Calm',
    theme: 'comfort',
    variants: {
      ja: [
        { catSound: 'るる…', responseText: '大丈夫だよって、静かに落ち着かせる感じにゃ。', soundKey: 'sleep', mood: '安心' },
        { catSound: 'みゅ…', responseText: 'ゆっくりしていいよ、っていう空気にゃ。', soundKey: 'sleep', mood: '安心' },
        { catSound: 'ふぅ…', responseText: '刺激を下げて、安心させる合図っぽいにゃ。', soundKey: 'cute', mood: '安心' },
      ],
      en: [
        { catSound: 'mrr...', responseText: 'A soft steady settle-down cue.', soundKey: 'sleep', mood: '安心' },
        { catSound: 'prr...', responseText: 'Feels soothing and reassuring.', soundKey: 'sleep', mood: '安心' },
        { catSound: 'mmmrr...', responseText: 'A low calm signal to ease the moment.', soundKey: 'cute', mood: '安心' },
      ],
    },
  },
  {
    id: 'food',
    labelJa: 'ごはん',
    labelEn: 'Food',
    theme: 'food',
    variants: {
      ja: [
        { catSound: 'みゃっ！ みゃっ！', responseText: 'ごはんの気配を出すなら、かなり通じやすいにゃ。', soundKey: 'food', mood: '要求' },
        { catSound: 'にゃー！', responseText: '食事の合図っぽく、期待を集める感じにゃ。', soundKey: 'food', mood: '要求' },
        { catSound: 'みゅっ！', responseText: 'ごはんだよっていう、わかりやすい呼びかけにゃ。', soundKey: 'food', mood: '要求' },
      ],
      en: [
        { catSound: 'mrrp! mrrp!', responseText: 'A clear food-time kind of cue.', soundKey: 'food', mood: '要求' },
        { catSound: 'meow!', responseText: 'Very easy to read as meal-related.', soundKey: 'food', mood: '要求' },
        { catSound: 'mraow!', responseText: 'Carries that expectant food energy.', soundKey: 'food', mood: '要求' },
      ],
    },
  },
  {
    id: 'play',
    labelJa: '遊ぼう',
    labelEn: 'Play',
    theme: 'play',
    variants: {
      ja: [
        { catSound: 'ぷるるっ！', responseText: 'ちょっと元気を上げて、遊びに誘う感じにゃ。', soundKey: 'play', mood: '興味' },
        { catSound: 'みゃっ！', responseText: '動きたくなるような、軽いお誘いにゃ。', soundKey: 'play', mood: '興味' },
        { catSound: 'にゃっ！', responseText: '遊びのスイッチを入れにいく合図っぽいにゃ。', soundKey: 'play', mood: '興味' },
      ],
      en: [
        { catSound: 'brrt!', responseText: 'A lively little invitation to engage.', soundKey: 'play', mood: '興味' },
        { catSound: 'mrrp!', responseText: 'Feels playful and ready to move.', soundKey: 'play', mood: '興味' },
        { catSound: 'prrp!', responseText: 'A bright cue that nudges play mode.', soundKey: 'play', mood: '興味' },
      ],
    },
  },
  {
    id: 'praise',
    labelJa: 'ほめる',
    labelEn: 'Praise',
    theme: 'affection',
    variants: {
      ja: [
        { catSound: 'ぷるっ！', responseText: 'いい子だよって、明るく気持ちを乗せる感じにゃ。', soundKey: 'cute', mood: '甘え' },
        { catSound: 'にゃ♡', responseText: 'ほめる空気は、やわらかく伝わりやすいにゃ。', soundKey: 'love', mood: '甘え' },
        { catSound: 'みゅっ', responseText: '前向きな気分を返したい時の響きにゃ。', soundKey: 'cute', mood: '甘え' },
      ],
      en: [
        { catSound: 'prrp!', responseText: 'A bright approving kind of signal.', soundKey: 'cute', mood: '甘え' },
        { catSound: 'mew <3', responseText: 'Warm praise with a gentle lift.', soundKey: 'love', mood: '甘え' },
        { catSound: 'mrrp!', responseText: 'Carries that affectionate good-job feel.', soundKey: 'cute', mood: '甘え' },
      ],
    },
  },
  {
    id: 'stop',
    labelJa: 'ダメ',
    labelEn: 'Stop',
    theme: 'discipline',
    variants: {
      ja: [
        { catSound: 'ちっ！', responseText: '短く止める時の、きっぱりした合図にゃ。', soundKey: 'no', mood: '不満' },
        { catSound: 'にゃっ', responseText: '強すぎず、でも線を引く感じにゃ。', soundKey: 'no', mood: '不満' },
        { catSound: 'ふっ', responseText: 'やめようねって、短く区切る空気にゃ。', soundKey: 'no', mood: '不満' },
      ],
      en: [
        { catSound: 'tchk!', responseText: 'A short firm cue to stop.', soundKey: 'no', mood: '不満' },
        { catSound: 'mrrh.', responseText: 'Brief, clear, and not overly harsh.', soundKey: 'no', mood: '不満' },
        { catSound: 'tsk!', responseText: 'A quick boundary-setting signal.', soundKey: 'no', mood: '不満' },
      ],
    },
  },
];

const HUMAN_TO_CAT_INTENT_MAP = HUMAN_TO_CAT_INTENTS.reduce<
  Record<HumanToCatIntentId, HumanToCatIntentDefinition>
>((acc, intent) => {
  acc[intent.id] = intent;
  return acc;
}, {} as Record<HumanToCatIntentId, HumanToCatIntentDefinition>);

export function getHumanToCatIntentDefinition(
  intentId: HumanToCatIntentId
): HumanToCatIntentDefinition {
  return HUMAN_TO_CAT_INTENT_MAP[intentId];
}

export function getHumanToCatIntentLabel(
  intentId: HumanToCatIntentId,
  language: AppLanguage
): string {
  const intent = getHumanToCatIntentDefinition(intentId);
  return language === 'ja' ? intent.labelJa : intent.labelEn;
}

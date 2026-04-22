import { AppLanguage } from '../i18n/strings';
import { InteractionTheme } from './catPersona';

export type HumanToCatIntentId =
  | 'call'
  | 'soothe'
  | 'praise'
  | 'food'
  | 'play';

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

// Grid order: row 1 -> call, soothe, praise / row 2 -> food, play
export const HUMAN_TO_CAT_INTENTS: HumanToCatIntentDefinition[] = [
  {
    id: 'call',
    labelJa: '呼ぶ',
    labelEn: 'Call',
    theme: 'comfort',
    variants: {
      ja: [
        {
          catSound: 'mrrp? mrrp?',
          responseText: 'やさしく呼ぶ感じ、ちゃんと出てるにゃ。',
          soundKey: 'lonely',
          mood: '甘え',
        },
        {
          catSound: 'mrrp...',
          responseText: '近くにおいでって、静かに誘う雰囲気にゃ。',
          soundKey: 'lonely',
          mood: '甘え',
        },
        {
          catSound: 'prrp?',
          responseText: 'そばに来てほしい時の、やわらかい呼びかけにゃ。',
          soundKey: 'lonely',
          mood: '甘え',
        },
      ],
      en: [
        {
          catSound: 'mrrp? mrrp?',
          responseText: 'A soft inviting call to come closer.',
          soundKey: 'lonely',
          mood: '甘え',
        },
        {
          catSound: 'mrrp...',
          responseText: 'Gentle and close, like a come-here cue.',
          soundKey: 'lonely',
          mood: '甘え',
        },
        {
          catSound: 'prrp?',
          responseText: 'Feels like a quiet little call for attention.',
          soundKey: 'lonely',
          mood: '甘え',
        },
      ],
    },
  },
  {
    id: 'soothe',
    labelJa: 'だいじょうぶ',
    labelEn: "It's okay",
    theme: 'comfort',
    variants: {
      ja: [
        {
          catSound: 'mrr...',
          responseText: '落ち着いていいよって、低く静かに伝える感じにゃ。',
          soundKey: 'sleep',
          mood: '安心',
        },
        {
          catSound: 'mrr..',
          responseText: '刺激を下げて、安心させる合図に近いにゃ。',
          soundKey: 'sleep',
          mood: '安心',
        },
        {
          catSound: 'prr...',
          responseText: 'なだめるより、そっと整えるような響きにゃ。',
          soundKey: 'sleep',
          mood: '安心',
        },
      ],
      en: [
        {
          catSound: 'mrr...',
          responseText: 'A calm, reassuring settle-down cue.',
          soundKey: 'sleep',
          mood: '安心',
        },
        {
          catSound: 'mrr..',
          responseText: 'Soft and steady, like easing the room back down.',
          soundKey: 'sleep',
          mood: '安心',
        },
        {
          catSound: 'prr...',
          responseText: 'More soothing than calling, quiet and even.',
          soundKey: 'sleep',
          mood: '安心',
        },
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
        {
          catSound: 'prrp!',
          responseText: 'いい子だよって、明るく前向きに伝わる感じにゃ。',
          soundKey: 'cute',
          mood: '甘え',
        },
        {
          catSound: 'prrp!!',
          responseText: 'ほめる時の、軽く跳ねるような空気にゃ。',
          soundKey: 'cute',
          mood: '甘え',
        },
        {
          catSound: 'mrrp!',
          responseText: 'やさしい承認を返したい時の調子に近いにゃ。',
          soundKey: 'cute',
          mood: '甘え',
        },
      ],
      en: [
        {
          catSound: 'prrp!',
          responseText: 'A warm approving chirp.',
          soundKey: 'cute',
          mood: '甘え',
        },
        {
          catSound: 'prrp!!',
          responseText: 'Bright and positive, like a tiny good-job cue.',
          soundKey: 'cute',
          mood: '甘え',
        },
        {
          catSound: 'mrrp!',
          responseText: 'Feels warmly approving without pushing too hard.',
          soundKey: 'cute',
          mood: '甘え',
        },
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
        {
          catSound: 'mrrp! mrrp!',
          responseText: 'ごはんの期待をはっきり出す時のテンポにゃ。',
          soundKey: 'food',
          mood: '要求',
        },
        {
          catSound: 'mrrp! mrrp!!',
          responseText: '食事の流れを思い出させるなら、この感じは強いにゃ。',
          soundKey: 'food',
          mood: '要求',
        },
        {
          catSound: 'mraow! mrrp!',
          responseText: '少し前のめりな、ごはん待ちの合図っぽいにゃ。',
          soundKey: 'food',
          mood: '要求',
        },
      ],
      en: [
        {
          catSound: 'mrrp! mrrp!',
          responseText: 'A clear food-time cue.',
          soundKey: 'food',
          mood: '要求',
        },
        {
          catSound: 'mrrp! mrrp!!',
          responseText: 'Bright, expectant, and easy to read as meal-related.',
          soundKey: 'food',
          mood: '要求',
        },
        {
          catSound: 'mraow! mrrp!',
          responseText: 'Carries that eager food-is-coming energy.',
          soundKey: 'food',
          mood: '要求',
        },
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
        {
          catSound: 'brrt!',
          responseText: '遊びに誘うなら、この軽い勢いが合いそうにゃ。',
          soundKey: 'play',
          mood: '興味',
        },
        {
          catSound: 'brrt! prrp!',
          responseText: '気分を前に出して、動きたくさせる感じにゃ。',
          soundKey: 'play',
          mood: '興味',
        },
        {
          catSound: 'mrrt!',
          responseText: 'ちょっと元気を乗せた、お誘いの合図にゃ。',
          soundKey: 'play',
          mood: '興味',
        },
      ],
      en: [
        {
          catSound: 'brrt!',
          responseText: 'A lively invitation to play.',
          soundKey: 'play',
          mood: '興味',
        },
        {
          catSound: 'brrt! prrp!',
          responseText: 'Energetic and playful, like nudging the moment into motion.',
          soundKey: 'play',
          mood: '興味',
        },
        {
          catSound: 'mrrt!',
          responseText: 'A quick playful cue with a little spark in it.',
          soundKey: 'play',
          mood: '興味',
        },
      ],
    },
  },
];

const HUMAN_TO_CAT_INTENT_MAP = HUMAN_TO_CAT_INTENTS.reduce<
  Partial<Record<HumanToCatIntentId, HumanToCatIntentDefinition>>
>((acc, intent) => {
  acc[intent.id] = intent;
  return acc;
}, {});

export function getHumanToCatIntentDefinition(
  intentId: HumanToCatIntentId
): HumanToCatIntentDefinition | undefined {
  return HUMAN_TO_CAT_INTENT_MAP[intentId];
}

export function getHumanToCatIntentLabel(
  intentId: string,
  language: AppLanguage
): string {
  const intent = HUMAN_TO_CAT_INTENT_MAP[intentId as HumanToCatIntentId];
  if (!intent) return intentId;
  return language === 'ja' ? intent.labelJa : intent.labelEn;
}

import { createSeed, pickBySeed } from '../../logic/catPersona';
import { AppLanguage } from '../../i18n/strings';
import { ConfidenceBand, IntentBucket } from './types';

type ReplyGeneratorInput = {
  language: AppLanguage;
  primaryIntent: IntentBucket;
  confidenceBand: ConfidenceBand;
};

type ReplyShape = {
  summaryText: string;
  catSubtitle: string;
};

const SUMMARY_BANK: Record<
  AppLanguage,
  Record<IntentBucket, Record<ConfidenceBand, string[]>>
> = {
  ja: {
    attention_like: {
      low: ['少し構ってほしい声にも聞こえます。'],
      medium: ['あなたに向けた小さな呼びかけかもしれません。'],
      high: ['ちょっとした確認の声に近いかもしれません。'],
    },
    food_like: {
      low: ['ごはんのことが少し頭にある声にも聞こえます。'],
      medium: ['食事どきの空気に少し近いかもしれません。'],
      high: ['少しごはん寄りの呼びかけに聞こえるかもしれません。'],
    },
    playful: {
      low: ['少し遊びっぽい空気にも聞こえます。'],
      medium: ['ちょっと気分が弾んでいるのかもしれません。'],
      high: ['遊びたい気配が少し出ている声かもしれません。'],
    },
    curious: {
      low: ['何かに気づいた声にも聞こえます。'],
      medium: ['急ぐより、気にして見ている感じかもしれません。'],
      high: ['「あれは何だろう」という声に少し近いかもしれません。'],
    },
    unsettled: {
      low: ['少しだけ落ち着かなさもありそうです。'],
      medium: ['今はややそわそわしているのかもしれません。'],
      high: ['少し居心地の悪さがある時の声かもしれません。'],
    },
    sleepy: {
      low: ['静かで眠そうな空気にも聞こえます。'],
      medium: ['少しずつ落ち着いてきているのかもしれません。'],
      high: ['やわらかい低めの気分の声かもしれません。'],
    },
    unknown: {
      low: ['この声はまだ少し混ざって聞こえます。'],
      medium: ['今のところは開いたまま受け取るのがよさそうです。'],
      high: ['もう少し手がかりがあると、読みやすくなりそうです。'],
    },
  },
  en: {
    attention_like: {
      low: ['Sounds like they may want a little attention.'],
      medium: ['Feels like this one is meant for you.'],
      high: ['Might be a small check-in.'],
    },
    food_like: {
      low: ['Sounds like food may be on their mind.'],
      medium: ['Feels a bit like a meal-time moment.'],
      high: ['Might be leaning food-related.'],
    },
    playful: {
      low: ['Sounds like a playful kind of moment.'],
      medium: ['Feels a little lively here.'],
      high: ['Might be some play energy coming through.'],
    },
    curious: {
      low: ['Sounds like something caught their interest.'],
      medium: ['Feels more curious than urgent.'],
      high: ['Might be a small "what\'s that?" moment.'],
    },
    unsettled: {
      low: ['Sounds like something may feel a little off.'],
      medium: ['Feels slightly unsettled right now.'],
      high: ['Might be a less comfortable moment.'],
    },
    sleepy: {
      low: ['Sounds like a quiet, sleepy moment.'],
      medium: ['Feels like they may be winding down.'],
      high: ['Might be a soft, low-energy moment.'],
    },
    unknown: {
      low: ['This one still feels a bit mixed.'],
      medium: ['Sounds open-ended for now.'],
      high: ['Might need a little more context to read cleanly.'],
    },
  },
};

const SUBTITLE_BANK: Record<AppLanguage, Record<IntentBucket, string[]>> = {
  ja: {
    attention_like: ['にゃ… ここだよ', 'ここにいるよ'],
    food_like: ['みゃ… ごはん？', 'そろそろかな'],
    playful: ['みゃ… あそぶ？', 'ちょっと元気'],
    curious: ['ん… なにかな', 'ちょっと見てる'],
    unsettled: ['なんだか気になる', '少しそわそわ'],
    sleepy: ['ん… ねむい', 'しずかだね'],
    unknown: ['まだはっきりしない', 'ちょっと混ざってる'],
  },
  en: {
    attention_like: ['mrrp... over here', "i'm here"],
    food_like: ['mrr... food?', "maybe it's time"],
    playful: ['mrrp... play?', 'awake and interested'],
    curious: ["mm... what's that", 'checking it out'],
    unsettled: ['something feels off', 'a little uneasy'],
    sleepy: ['mm... sleepy', 'quiet now'],
    unknown: ['not clear yet', 'mixed signal'],
  },
};

export function buildInterpretiveReply(input: ReplyGeneratorInput): ReplyShape {
  const seed = createSeed(input.language, input.primaryIntent, input.confidenceBand);
  const summaryText = pickBySeed(
    SUMMARY_BANK[input.language][input.primaryIntent][input.confidenceBand],
    seed
  );
  const catSubtitle = pickBySeed(SUBTITLE_BANK[input.language][input.primaryIntent], seed + 11);

  return {
    summaryText,
    catSubtitle,
  };
}

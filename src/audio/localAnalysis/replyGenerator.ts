import { createSeed, pickBySeed } from '../../logic/catPersona';
import { AppLanguage } from '../../i18n/strings';
import { ConfidenceBand, IntentBucket } from './types';

type ReplyGeneratorInput = {
  language: AppLanguage;
  primaryIntent: IntentBucket;
  confidenceBand: ConfidenceBand;
  secondaryIntents: IntentBucket[];
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
      low: ['少し構ってほしい声にも聞こえます。', '静かな呼びかけ寄りにも見えます。'],
      medium: ['あなたに向けた小さな呼びかけかもしれません。', 'そばに来てほしい時の声に少し近いかもしれません。'],
      high: ['ちょっとした確認の声に近いかもしれません。', '意識を向けてほしい時の声として読むのが自然かもしれません。'],
    },
    food_like: {
      low: ['ごはんのことが少し頭にある声にも聞こえます。', '食べものを気にしていそうな気配も少しあります。'],
      medium: ['食事どきの空気に少し近いかもしれません。', '少しだけ「何かほしい」寄りの声に見えます。'],
      high: ['少しごはん寄りの呼びかけに聞こえるかもしれません。', '要求の向きがやや食事側に寄っているかもしれません。'],
    },
    playful: {
      low: ['少し遊びっぽい空気にも聞こえます。', '退屈よりは動きたそうな声に見えます。'],
      medium: ['ちょっと気分が弾んでいるのかもしれません。', '軽く遊びに誘う時の空気に近いかもしれません。'],
      high: ['遊びたい気配が少し出ている声かもしれません。', '動きたい時の明るさがやや見えます。'],
    },
    curious: {
      low: ['何かに気づいた声にも聞こえます。', '注意がどこかに向いた時の声かもしれません。'],
      medium: ['急ぐより、気にして見ている感じかもしれません。', '様子をうかがう寄りの反応に見えます。'],
      high: ['「あれは何だろう」という声に少し近いかもしれません。', '確認したいものがある時の声として読むと自然かもしれません。'],
    },
    unsettled: {
      low: ['少しだけ落ち着かなさもありそうです。', 'ほんの少し引っかかりがある声にも見えます。'],
      medium: ['今はややそわそわしているのかもしれません。', '落ち着く前の小さな不満が混じるかもしれません。'],
      high: ['少し居心地の悪さがある時の声かもしれません。', '何かが気になって落ち着きにくい時の声として読めます。'],
    },
    sleepy: {
      low: ['静かで眠そうな空気にも聞こえます。', '強い要求より、静かな時間の声に近いかもしれません。'],
      medium: ['少しずつ落ち着いてきているのかもしれません。', '休みに入りかけている時の声にも聞こえます。'],
      high: ['やわらかい低めの気分の声かもしれません。', '眠いというより、かなり落ち着いた側の声かもしれません。'],
    },
    unknown: {
      low: ['この声はまだ少し混ざって聞こえます。'],
      medium: ['今のところは開いたまま受け取るのがよさそうです。'],
      high: ['もう少し手がかりがあると、読みやすくなりそうです。'],
    },
  },
  en: {
    attention_like: {
      low: ['Sounds like they may want a little attention.', 'Could be a quiet bid for attention.'],
      medium: ['Feels like this one is meant for you.', 'Reads a bit like a small call toward you.'],
      high: ['Might be a small check-in.', 'Could be a direct little check-in.'],
    },
    food_like: {
      low: ['Sounds like food may be on their mind.', 'Could be a mild food-leaning moment.'],
      medium: ['Feels a bit like a meal-time moment.', 'Reads slightly more like a wanting-something moment.'],
      high: ['Might be leaning food-related.', 'Could be leaning toward a food request.'],
    },
    playful: {
      low: ['Sounds like a playful kind of moment.', 'Could be more playful than urgent.'],
      medium: ['Feels a little lively here.', 'Reads like a brighter, more active moment.'],
      high: ['Might be some play energy coming through.', 'Could be a small invitation to interact.'],
    },
    curious: {
      low: ['Sounds like something caught their interest.', 'Could be a notice-and-watch kind of moment.'],
      medium: ['Feels more curious than urgent.', 'Reads more observant than demanding.'],
      high: ['Might be a small "what\'s that?" moment.', 'Could be a clear little curiosity ping.'],
    },
    unsettled: {
      low: ['Sounds like something may feel a little off.', 'Could be a lightly uneasy moment.'],
      medium: ['Feels slightly unsettled right now.', 'Reads like a small discomfort signal.'],
      high: ['Might be a less comfortable moment.', 'Could be a stronger uneasy reaction.'],
    },
    sleepy: {
      low: ['Sounds like a quiet, sleepy moment.', 'Could be more calm than active.'],
      medium: ['Feels like they may be winding down.', 'Reads like a settling-down moment.'],
      high: ['Might be a soft, low-energy moment.', 'Could be a very calm, low-energy read.'],
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
  const seed = createSeed(
    input.language,
    input.primaryIntent,
    input.confidenceBand,
    input.secondaryIntents.join('-')
  );
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

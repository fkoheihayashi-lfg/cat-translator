import { createSeed } from '../../logic/catPersona';
import { pickBySeed } from '../../logic/catPersona';
import { AnalysisMode, ConfidenceBand, EnrichedContextFeatures, IntentBucket, IntentScores, LocalAnalysisContext } from './types';

type ReplyShape = {
  summaryText: string;
  catSubtitle: string;
};

const SUMMARY_POOL = {
  ja: {
    attention: ['今はちょっと構ってほしい気分かも。', 'あなたの気配を近くで感じたいのかもしれません。', 'そばにいてほしい合図に少し近いです。', '「ちょっと見てて」という感じの声かも。', '今は一人でいたくない気分なのかもしれません。'],
    food_like: ['もしかすると、ごはんのことが少し頭にあるかも。', '少し期待しながら待っている感じがあります。', 'この声は、軽いおねだりにも聞こえます。', 'なんとなく催促っぽいニュアンスが混じっているかも。', '食事の時間が近いなら、それを感じているのかもしれません。'],
    playful: ['遊びのスイッチが入りかけているかも。', 'ちょっと気分が前に出てきた声っぽいです。', '動きたい空気が少し混ざっていそう。', 'なにか引っかかりを見つけて、興奮しているのかも。', '体を動かしたそうな、少し弾んだ声に聞こえます。'],
    curious: ['何かを気にして、様子を見ている感じ。', '少し探るように興味を向けていそうです。', '気になるものへ向いた短い呼びかけかも。', 'あたりを確認しながら、小さく声を出している感じ。', '何かに気づいて、じっと見ているのかもしれません。'],
    unsettled: ['少し落ち着かなさが混ざっているかもしれません。', '今はほんのり気分が揺れているのかも。', '少しだけざわついた空気に聞こえます。', 'なにか気になることがあって、もやもやしているのかも。', '落ち着こうとしているけれど、まだうまくいっていない声かも。'],
    sleepy: ['今はゆるく落ち着きたい空気かも。', '眠気まじりで、静かにいたいのかもしれません。', '安心して力を抜いている声っぽいです。', 'うとうとしながら、小さく鳴いた感じかも。', 'もう少ししたら眠りにつきそうな、ゆったりした声です。'],
    unknown: ['短めの反応で、今はまだ読み切れないかも。', '小さな声なので、やわらかく受け取るのがよさそうです。', 'はっきりした意図というより、軽い呼びかけ寄りかも。', 'とりあえず声を出してみた、という感じに近いかもしれません。', '今この瞬間の気分をそのまま出した声のようです。'],
  },
  en: {
    attention: ['Feels like they want your attention right now.', 'This sounds like a small call to stay close.', 'Might be a gentle request for your presence.', 'Could be a nudge to let you know they\'re around.', 'Sounds like they\'d like a moment of company.'],
    food_like: ['Maybe food is on their mind a little.', 'Could be a soft expectant call, maybe around snacks.', 'This has the feel of a small, hopeful ask.', 'Might be a gentle hint that it\'s nearly meal time.', 'Sounds like they\'re thinking about something tasty.'],
    playful: ['Could be the start of a playful mood.', 'This has a light, ready-to-move energy.', 'Might be a tiny invitation to play.', 'Sounds like something caught their interest.', 'There\'s a bit of a bounce in this one.'],
    curious: ['This sounds more curious than upset.', 'Feels like a quick check-in about something nearby.', 'Could be a curious little probe.', 'Something nearby probably caught their attention.', 'Sounds like they\'re quietly investigating something.'],
    unsettled: ['A bit unsettled, maybe they want you nearby.', 'This one has a slightly restless edge.', 'Could be a brief moment of unease.', 'Something might be on their mind right now.', 'Sounds like they\'re not quite comfortable yet.'],
    sleepy: ['Feels calm, maybe a little sleepy.', 'This sounds like a soft, winding-down call.', 'Might be a cozy, low-energy check-in.', 'Could be a drowsy little murmur.', 'Sounds like they\'re getting ready to settle.'],
    unknown: ['Hard to read clearly, but still sounds like a little call.', 'This one is subtle — a gentle read fits best.', 'Not fully clear yet, maybe just a quiet hello.', 'Feels more like a passing sound than a strong request.', 'Open to interpretation — something mild and unhurried.'],
  },
} as const;

const SUBTITLE_POOL = {
  ja: {
    attention: ['にゃ…', 'みゅ…', 'にゃぁ…'],
    food_like: ['にゃっ', 'みゃー', 'にゃー？'],
    playful: ['みゃっ！', 'にゃっ！', 'みゅっ！'],
    curious: ['にゃ？', 'みゅ？', 'みゃ？'],
    unsettled: ['むぅ…', 'にゃっ…', 'ふんにゃ'],
    sleepy: ['ごろ…', 'ふぅ…', 'にゃ…'],
    unknown: ['みゅ…', 'にゃ…？', 'mrr…'],
  },
  en: {
    attention: ['mew...', 'mrr...', 'prrp...'],
    food_like: ['meow?', 'mraow...', 'mew!'],
    playful: ['mrrp!', 'mew-mew!', 'prrp!'],
    curious: ['mew?', 'prrp?', 'mrrp?'],
    unsettled: ['mrrh...', 'huff-mew.', 'meh...'],
    sleepy: ['purr...', 'mrr...', 'prrr...'],
    unknown: ['mrr...', 'mew...', 'prrp...'],
  },
} as const;

function avoidRecentRepetition(
  candidates: readonly string[],
  repeatedSummaryHints: string[],
  seed: number
): string {
  const filtered = candidates.filter((line) => !repeatedSummaryHints.includes(line));
  if (filtered.length > 0) return pickBySeed(filtered, seed);
  return pickBySeed([...candidates], seed + 1);
}

export function buildInterpretiveReply(input: {
  primaryIntent: IntentBucket;
  intentScores: IntentScores;
  confidenceBand: ConfidenceBand;
  analysisMode: AnalysisMode;
  contextFeatures: EnrichedContextFeatures;
  context: LocalAnalysisContext;
}): ReplyShape {
  const language = input.context.language ?? 'ja';
  const name = input.context.profile?.name?.trim();
  const seed = createSeed(
    input.primaryIntent,
    input.confidenceBand,
    input.analysisMode,
    input.contextFeatures.recentMeowCount,
    input.contextFeatures.hourBucket,
    name ?? 'cat'
  );

  const baseSummary = avoidRecentRepetition(
    SUMMARY_POOL[language][input.primaryIntent],
    input.contextFeatures.repeatedSummaryHints,
    seed
  );

  const nuance =
    language === 'ja'
      ? input.confidenceBand === 'low'
        ? '今は決めつけず、やわらかく受け取るのがよさそう。'
        : input.contextFeatures.followsRepeatedCluster
          ? '続けて呼んでいるなら、少し反応してあげるとよさそう。'
          : ''
      : input.confidenceBand === 'low'
        ? 'Worth keeping an open read on this one.'
        : input.contextFeatures.followsRepeatedCluster
          ? 'Worth checking in if this keeps up.'
          : '';

  const personalization =
    name && input.primaryIntent !== 'unknown'
      ? language === 'ja'
        ? ` ${name}らしい呼びかけにも聞こえます。`
        : ` That sounds like ${name}.`
      : '';

  const summaryText = `${baseSummary}${nuance ? ` ${nuance}` : ''}${personalization}`.trim();
  const catSubtitle = pickBySeed(
    [...SUBTITLE_POOL[language][input.primaryIntent]],
    seed + 7
  );

  return {
    summaryText,
    catSubtitle,
  };
}

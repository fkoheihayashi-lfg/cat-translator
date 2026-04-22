import { CatPersonaState, InteractionTheme } from '../logic/catPersona';
import {
  AnalysisMode,
  ConfidenceBand,
  IntentBucket,
} from '../audio/localAnalysis/types';

export type AppLanguage = 'ja' | 'en';

const TOPIC_LABELS: Record<AppLanguage, Record<InteractionTheme, string>> = {
  ja: {
    affection: '甘え',
    food: 'ごはん',
    play: '遊び',
    rest: '休憩',
    comfort: 'そば',
    discipline: '不満',
    curiosity: '興味',
    general: 'ふだん',
  },
  en: {
    affection: 'affection',
    food: 'food',
    play: 'play',
    rest: 'rest',
    comfort: 'closeness',
    discipline: 'pushback',
    curiosity: 'curiosity',
    general: 'everyday',
  },
};

const PERSONALITY_LABELS: Record<AppLanguage, Record<string, string>> = {
  ja: {
    甘えん坊: '甘えん坊',
    マイペース: 'マイペース',
    好奇心旺盛: '好奇心旺盛',
    クール: 'クール',
  },
  en: {
    甘えん坊: 'Cuddly',
    マイペース: 'Laid-back',
    好奇心旺盛: 'Adventurous',
    クール: 'Aloof',
  },
};

const MOOD_LABELS: Record<AppLanguage, Record<string, string>> = {
  ja: {
    甘え: '甘え',
    要求: '要求',
    不満: '不満',
    興味: '興味',
    安心: '安心',
  },
  en: {
    甘え: 'Affection',
    要求: 'Wanting',
    不満: 'Pushback',
    興味: 'Curious',
    安心: 'Settled',
  },
};

const INTENT_LABELS: Record<AppLanguage, Record<IntentBucket, string>> = {
  ja: {
    attention: '構って',
    food_like: 'ごはん気分',
    playful: '遊びたい',
    curious: '気になる',
    unsettled: '少しそわそわ',
    sleepy: '落ち着き',
    unknown: '様子見',
  },
  en: {
    attention: 'Attention',
    food_like: 'Food-like',
    playful: 'Playful',
    curious: 'Curious',
    unsettled: 'Unsettled',
    sleepy: 'Sleepy',
    unknown: 'Open-ended',
  },
};

const CONFIDENCE_LABELS: Record<AppLanguage, Record<ConfidenceBand, string>> = {
  ja: {
    low: 'ひかえめ',
    medium: 'ほどほど',
    high: 'くっきり',
  },
  en: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
};

const ANALYSIS_MODE_LABELS: Record<AppLanguage, Record<AnalysisMode, string>> = {
  ja: {
    local_audio_heuristic: '音の手がかり',
    local_context_fallback: 'いつもの流れ',
  },
  en: {
    local_audio_heuristic: 'Sound Hint',
    local_context_fallback: 'Context Hint',
  },
};

export const PERSONALITY_OPTIONS = ['甘えん坊', 'マイペース', '好奇心旺盛', 'クール'] as const;

export const STRINGS = {
  ja: {
    common: {
      back: '← 戻る',
      replay: '▶ 再生',
      replayAgain: '▶ もう一度再生',
      send: '送信',
      save: '保存する',
      saved: '保存しました ✓',
      recLabel: '● REC',
      stopLabel: '■ STOP',
      micPermission: 'マイクのアクセスを許可してください',
      humanToCat: '人間 → 猫',
      catToHuman: '猫 → 人間',
      humanToCatSystem: 'HUMAN → CAT',
      catToHumanSystem: 'CAT → HUMAN',
      textMode: '✎ TEXT',
      recordingMode: '● REC',
      recordingActive: 'RECORDING CAT AUDIO…',
      loadingTranslateText: '猫語に変換中…',
      loadingAnalyzeAudio: '鳴き声を解析中…',
    },
    boot: {
      systemBoot: 'SYSTEM BOOT',
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat · Human Interpreter',
      status: 'LINK ESTABLISHED ◆',
    },
    home: {
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat · Human Interpreter',
      startConversation: '会話をはじめる',
      startHint: '継続中の会話スレッドを開きます',
      listen: '聞かせる',
      log: '会話ログ',
      profile: '猫プロフィール',
      latestReceived: '最新の受信',
      latestSent: '最新の送信',
      threadCount: '会話スレッド {count} 件 · {hint}',
      threadEmpty: '会話スレッド 未開始 · {hint}',
      connected: '◆ {name} と通信中 · {bond}',
      connectedFallback: '◆ CAT COMM LINK ACTIVE · {bond}',
    },
    conversation: {
      emptyTitle: '通信待機中',
      emptyText: '話しかけるか、猫の声を聞かせてください',
      inputPlaceholder: '猫に話しかける…',
      unnamedCat: '未登録の猫',
    },
    translate: {
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat → Human Interpreter',
      listenAgain: 'もう一度聞かせる',
      analyzing: '解析中…',
      prompt: '猫の声を聞かせる',
    },
    speak: {
      title: '話しかける',
      subtitle: '猫に伝えたいことを入力してください',
      quickActions: 'クイック意図',
      textLabel: '自由入力',
      inputPlaceholder: '例：大好きだよ、かわいいね',
      loading: '変換中…',
      badge: '猫語',
    },
    log: {
      title: '会話ログ',
      subtitle: '最近の会話 · {count} 件',
      emptyTitle: 'まだ会話がありません',
      emptySubtitle: '猫の声を聞かせてみてください',
      today: '今日 {time}',
      yesterday: '昨日 {time}',
    },
    profile: {
      title: '猫プロフィール',
      subtitle: 'あなたの猫を教えてください',
      nameLabel: '猫の名前',
      namePlaceholder: '例：むぎ、そら、ちゃこ',
      personalityLabel: '性格タイプ',
      languageLabel: '表示言語',
      languageSubtitle: 'アプリの UI 表示を切り替えます',
      languageJa: '日本語',
      languageEn: 'English',
    },
    persona: {
      bond: {
        new: '様子見',
        warming: '少し慣れた',
        bonded: 'かなり親しい',
        attached: 'すっかり甘え気味',
      },
    },
  },
  en: {
    common: {
      back: '← Back',
      replay: '▶ Replay',
      replayAgain: '▶ Replay',
      send: 'Send',
      save: 'Save',
      saved: 'Saved ✓',
      recLabel: '● REC',
      stopLabel: '■ STOP',
      micPermission: 'Please allow microphone access',
      humanToCat: 'Human → Cat',
      catToHuman: 'Cat → Human',
      humanToCatSystem: 'HUMAN → CAT',
      catToHumanSystem: 'CAT → HUMAN',
      textMode: '✎ TEXT',
      recordingMode: '● REC',
      recordingActive: 'RECORDING CAT AUDIO…',
      loadingTranslateText: 'Converting to cat speech…',
      loadingAnalyzeAudio: 'Analyzing the meow…',
    },
    boot: {
      systemBoot: 'SYSTEM BOOT',
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat · Human Interpreter',
      status: 'LINK ESTABLISHED ◆',
    },
    home: {
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat · Human Interpreter',
      startConversation: 'Start Conversation',
      startHint: 'Open the ongoing conversation thread',
      listen: 'Listen',
      log: 'Conversation Log',
      profile: 'Cat Profile',
      latestReceived: 'Latest received',
      latestSent: 'Latest sent',
      threadCount: 'Conversation thread {count} · {hint}',
      threadEmpty: 'Conversation thread not started · {hint}',
      connected: '◆ Linked with {name} · {bond}',
      connectedFallback: '◆ CAT COMM LINK ACTIVE · {bond}',
    },
    conversation: {
      emptyTitle: 'Standing by',
      emptyText: 'Type to your cat or let the app hear a meow',
      inputPlaceholder: 'Say something to your cat…',
      unnamedCat: 'Unnamed cat',
    },
    translate: {
      title: 'CAT TRANSLATOR',
      subtitle: 'Cat → Human Interpreter',
      listenAgain: 'Listen Again',
      analyzing: 'Analyzing…',
      prompt: 'Let the app hear your cat',
    },
    speak: {
      title: 'Speak',
      subtitle: 'Type something you want to say to your cat',
      quickActions: 'Quick Actions',
      textLabel: 'Custom Text',
      inputPlaceholder: 'Example: I love you, you are cute',
      loading: 'Converting…',
      badge: 'Cat speech',
    },
    log: {
      title: 'Conversation Log',
      subtitle: 'Recent exchanges · {count}',
      emptyTitle: 'No conversation yet',
      emptySubtitle: 'Try letting the app hear your cat',
      today: 'Today {time}',
      yesterday: 'Yesterday {time}',
    },
    profile: {
      title: 'Cat Profile',
      subtitle: 'Tell the app about your cat',
      nameLabel: 'Cat name',
      namePlaceholder: 'Example: Mugi, Sora, Chaco',
      personalityLabel: 'Personality type',
      languageLabel: 'Language',
      languageSubtitle: 'Switch the app UI language',
      languageJa: '日本語',
      languageEn: 'English',
    },
    persona: {
      bond: {
        new: 'Getting acquainted',
        warming: 'Warming up',
        bonded: 'Well bonded',
        attached: 'Very attached',
      },
    },
  },
} as const;

export function getStrings(language: AppLanguage) {
  return STRINGS[language];
}

export function getLocale(language: AppLanguage): string {
  return language === 'ja' ? 'ja-JP' : 'en-US';
}

export function formatWithVars(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template
  );
}

export function getPersonalityLabel(value: string, language: AppLanguage): string {
  return PERSONALITY_LABELS[language][value] ?? value;
}

export function getMoodLabel(value: string, language: AppLanguage): string {
  return MOOD_LABELS[language][value] ?? value;
}

export function getIntentLabel(value: IntentBucket, language: AppLanguage): string {
  return INTENT_LABELS[language][value] ?? value;
}

export function getConfidenceBandLabel(
  value: ConfidenceBand,
  language: AppLanguage
): string {
  return CONFIDENCE_LABELS[language][value] ?? value;
}

export function getAnalysisModeLabel(
  value: AnalysisMode,
  language: AppLanguage
): string {
  return ANALYSIS_MODE_LABELS[language][value] ?? value;
}

export function getTopicLabel(theme: InteractionTheme, language: AppLanguage): string {
  return TOPIC_LABELS[language][theme];
}

export function getBondLabel(personaState: CatPersonaState, language: AppLanguage): string {
  return STRINGS[language].persona.bond[personaState.relationshipStage];
}

export function getCommunicationHintText(
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  if (language === 'ja') {
    return personaState.communicationHint;
  }

  const { dominantTheme, personalityTone, relationshipStage } = personaState;
  if (dominantTheme === 'food') return 'expecting food soon';
  if (dominantTheme === 'play') return 'play mode, probably';
  if (dominantTheme === 'comfort' || dominantTheme === 'affection') {
    if (personalityTone === 'clingy') return 'extra clingy lately';
    if (personalityTone === 'reserved') return 'quietly comfortable';
    return 'feeling close';
  }
  if (dominantTheme === 'discipline') return 'a bit moody';
  if (dominantTheme === 'rest') return 'calm and settled';
  if (personalityTone === 'playful') return 'curious about things';
  if (relationshipStage === 'new') return 'still warming up';
  return 'link stable';
}

export function getBondHintText(
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  if (language === 'ja') {
    return personaState.bondHint;
  }

  const { relationshipStage, personalityTone } = personaState;
  if (relationshipStage === 'attached') {
    return personalityTone === 'reserved'
      ? 'trust is clearly growing'
      : 'feels very attached now';
  }
  if (relationshipStage === 'bonded') {
    return personalityTone === 'playful'
      ? 'responses feel more lively'
      : 'familiarity is showing';
  }
  if (relationshipStage === 'warming') {
    return 'getting used to the exchange';
  }
  return 'still feeling things out';
}

export function getRecentThemeSummaryText(
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  if (language === 'ja') {
    return personaState.recentThemeSummary;
  }

  const uniqueThemes = Array.from(
    new Set(personaState.recentThemes.filter((theme) => theme !== 'general'))
  );
  if (uniqueThemes.length === 0) return 'recently mostly everyday exchanges';
  if (uniqueThemes.length === 1) {
    return `recently focused on ${getTopicLabel(uniqueThemes[0], language)}`;
  }
  return `recently centered on ${getTopicLabel(uniqueThemes[0], language)} and ${getTopicLabel(uniqueThemes[1], language)}`;
}

export function formatThreadTime(createdAt: number, language: AppLanguage): string {
  return new Date(createdAt).toLocaleTimeString(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLogTime(createdAt: number, language: AppLanguage): string {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (isToday) return formatWithVars(STRINGS[language].log.today, { time });

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return formatWithVars(STRINGS[language].log.yesterday, { time });

  return d.toLocaleDateString(getLocale(language), {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

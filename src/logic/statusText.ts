import {
  AppLanguage,
  formatWithVars,
  getBondLabel,
  getCommunicationHintText,
  getStrings,
} from '../i18n/strings';
import { CatPersonaState } from './catPersona';

export function getCommunicationStatusText(
  catName: string,
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  const bond = getBondLabel(personaState, language);
  if (language === 'ja') {
    return catName ? `${catName} と通信中 · ${bond}` : `通信リンク動作中 · ${bond}`;
  }
  return catName ? `${catName} LINK ACTIVE · ${bond}` : `CAT COMM LINK ACTIVE · ${bond}`;
}

export function getConversationThreadStatusText(
  logCount: number,
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  const hint = getCommunicationHintText(personaState, language);
  if (language === 'ja') {
    return logCount > 0 ? `スレッド ${logCount} 件 · ${hint}` : `待機中 · ${hint}`;
  }
  return logCount > 0 ? `THREAD ${logCount} LOGS · ${hint}` : `THREAD STANDBY · ${hint}`;
}

export function getHomeStatusText(
  catName: string,
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  return getCommunicationStatusText(catName, personaState, language);
}

export function getHomeLogSummaryText(
  logCount: number,
  personaState: CatPersonaState,
  language: AppLanguage
): string {
  const strings = getStrings(language);
  const hint = getCommunicationHintText(personaState, language);
  return logCount > 0
    ? formatWithVars(strings.home.threadCount, { count: logCount, hint })
    : formatWithVars(strings.home.threadEmpty, { hint });
}

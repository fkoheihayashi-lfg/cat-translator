import { CatPersonaState } from './catPersona';

export function getCommunicationStatusText(
  catName: string,
  bondLabel: string
): string {
  return catName
    ? `${catName} LINK ACTIVE · ${bondLabel}`
    : `CAT COMM LINK ACTIVE · ${bondLabel}`;
}

export function getConversationThreadStatusText(
  logCount: number,
  communicationHint: string
): string {
  return logCount > 0
    ? `THREAD ${logCount} LOGS · ${communicationHint}`
    : `THREAD STANDBY · ${communicationHint}`;
}

export function getHomeStatusText(
  catName: string,
  personaState: CatPersonaState
): string {
  return catName
    ? `◆ ${catName} と通信中 · ${personaState.bondLabel}`
    : `◆ CAT COMM LINK ACTIVE · ${personaState.bondLabel}`;
}

export function getHomeLogSummaryText(
  logCount: number,
  communicationHint: string
): string {
  return logCount > 0
    ? `会話スレッド ${logCount} 件 · ${communicationHint}`
    : `会話スレッド 未開始 · ${communicationHint}`;
}

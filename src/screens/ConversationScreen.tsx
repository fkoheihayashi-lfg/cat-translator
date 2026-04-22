import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import CatAvatar from '../components/CatAvatar';
import { useCat } from '../context/CatContext';
import {
  formatThreadTime,
  getBondHintText,
  getConfidenceBandLabel,
  getIntentLabel,
  getMoodLabel,
  getRecentThemeSummaryText,
  getStrings,
} from '../i18n/strings';
import { getAvatarMoodFromInterpretation } from '../logic/analyzeCatAudio';
import { SOUND_AVATAR } from '../logic/generateCatReply';
import {
  runCatAudioAnalysisTransaction,
  runHumanToCatTextTransaction,
  startCatRecordingSession,
} from '../logic/textConversation';
import {
  getCommunicationStatusText,
  getConversationThreadStatusText,
} from '../logic/statusText';
import { playLoggedCatSound } from '../utils/playSound';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Conversation'>;
};

type PendingState = 'idle' | 'text_loading' | 'recording' | 'audio_loading';

const BAR_DURATIONS = [280, 340, 220, 380, 260];

export default function ConversationScreen({ navigation }: Props) {
  const { profile, language, personaState, log, addLog } = useCat();
  const strings = getStrings(language);
  const [inputText, setInputText] = useState('');
  const [pendingState, setPendingState] = useState<PendingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionLockRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const recordingAbortRef = useRef<AbortController | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const barAnims = useRef(BAR_DURATIONS.map(() => new Animated.Value(4))).current;
  const barLoops = useRef<Animated.CompositeAnimation[]>([]);

  const canSend = inputText.trim().length > 0;
  const catName = profile.name || strings.conversation.unnamedCat;
  const statusText = getCommunicationStatusText(profile.name, personaState, language);
  const threadStatus = getConversationThreadStatusText(
    log.length,
    personaState,
    language
  );

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });

    return () => {
      if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
      recordingAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (pendingState === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();

      barLoops.current = barAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 36, duration: BAR_DURATIONS[i], useNativeDriver: false }),
            Animated.timing(anim, { toValue: 4, duration: BAR_DURATIONS[i], useNativeDriver: false }),
          ])
        )
      );
      barLoops.current.forEach((loop) => loop.start());
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
      barLoops.current.forEach((loop) => loop.stop());
      barAnims.forEach((anim) => anim.setValue(4));
    }
  }, [pendingState, barAnims, pulseAnim]);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    scrollToBottom(log.length > 0);
  }, [log.length, pendingState]);

  const handleSend = () => {
    if (!canSend || pendingState !== 'idle' || actionLockRef.current) return;
    actionLockRef.current = true;
    setPermissionError(false);
    setPendingState('text_loading');

    sendTimeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          await runHumanToCatTextTransaction({
            text: inputText.trim(),
            language,
            profile,
            personaState,
            log,
            addLog,
            dismissKeyboard: Keyboard.dismiss,
            onReply: () => {
              setInputText('');
            },
            onComplete: () => {
              setPendingState('idle');
              actionLockRef.current = false;
              sendTimeoutRef.current = null;
            },
          });
        } finally {
          if (actionLockRef.current) {
            setPendingState('idle');
            actionLockRef.current = false;
            sendTimeoutRef.current = null;
          }
        }
      })();
    }, 1000);
  };

  const handleRecordPress = async () => {
    if (actionLockRef.current || pendingState === 'text_loading' || pendingState === 'audio_loading') {
      return;
    }

    if (pendingState !== 'recording') {
      actionLockRef.current = true;

      try {
        const nextRecording = await startCatRecordingSession({
          onPermissionDenied: () => {
            setPermissionError(true);
          },
          onPermissionGranted: () => {
            Keyboard.dismiss();
            setPermissionError(false);
          },
        });
        if (!nextRecording) return;
        setRecording(nextRecording);
        setPendingState('recording');
      } finally {
        actionLockRef.current = false;
      }
      return;
    }

    actionLockRef.current = true;

    try {
      recordingAbortRef.current = new AbortController();
      setRecording(null);
      await runCatAudioAnalysisTransaction({
        recording,
        language,
        profile,
        personaState,
        log,
        addLog,
        signal: recordingAbortRef.current.signal,
        onStartAnalysis: () => {
          setPendingState('audio_loading');
        },
        onComplete: () => {
          setPendingState('idle');
          actionLockRef.current = false;
          recordingAbortRef.current = null;
        },
      });
    } catch {
      setRecording(null);
      setPendingState('idle');
      actionLockRef.current = false;
      recordingAbortRef.current = null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{strings.common.back}</Text>
          </TouchableOpacity>
          <Text style={styles.headerSignal}>{threadStatus}</Text>
        </View>

        <View style={styles.headerMain}>
          <CatAvatar mood="neutral" size="small" />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{catName}</Text>
            <Text style={styles.headerStatus}>{statusText}</Text>
            <Text style={styles.headerHint}>
              {getBondHintText(personaState, language)} · {getRecentThemeSummaryText(personaState, language)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {log.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{strings.conversation.emptyTitle}</Text>
            <Text style={styles.emptyText}>{strings.conversation.emptyText}</Text>
          </View>
        ) : (
          log.map((entry) => {
            const isHuman = entry.direction === 'human_to_cat';
            const bubbleMood =
              entry.direction === 'human_to_cat'
                ? SOUND_AVATAR[entry.soundKey] ?? 'neutral'
                : getAvatarMoodFromInterpretation({ mood: entry.mood });

            return (
              <View
                key={entry.id}
                style={[
                  styles.bubbleRow,
                  isHuman ? styles.bubbleRowHuman : styles.bubbleRowCat,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isHuman ? styles.bubbleHuman : styles.bubbleCat,
                  ]}
                >
                  <View style={styles.bubbleTop}>
                    {!isHuman && <CatAvatar mood={bubbleMood} size="small" />}
                    <Text style={[styles.roleLabel, isHuman && styles.roleLabelHuman]}>
                      {isHuman ? strings.common.humanToCatSystem : strings.common.catToHumanSystem}
                    </Text>
                  </View>

                  {entry.rawText ? (
                    <Text
                      style={[
                        styles.bubbleSubtitle,
                        isHuman && styles.bubbleSubtitleHuman,
                      ]}
                    >
                      {entry.rawText}
                    </Text>
                  ) : null}

                  <Text style={[styles.bubbleText, isHuman && styles.bubbleTextHuman]}>
                    {entry.translatedText}
                  </Text>

                  <View style={styles.bubbleMeta}>
                    {entry.mood ? (
                      <Text style={[styles.moodTag, isHuman && styles.moodTagHuman]}>
                        {getMoodLabel(entry.mood, language)}
                      </Text>
                    ) : null}
                    {!isHuman && entry.primaryIntent ? (
                      <Text style={styles.analysisTag}>
                        {getIntentLabel(entry.primaryIntent, language)}
                      </Text>
                    ) : null}
                    {!isHuman && entry.confidenceBand ? (
                      <Text style={styles.analysisTag}>
                        {getConfidenceBandLabel(entry.confidenceBand, language)}
                      </Text>
                    ) : null}
                    {entry.soundKey ? (
                      <TouchableOpacity
                        onPress={() =>
                          playLoggedCatSound(
                            !isHuman ? entry.recordingUri : undefined,
                            entry.soundKey
                          )
                        }
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.replayText, isHuman && styles.replayTextHuman]}>
                          {strings.common.replay}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <Text style={[styles.timestamp, isHuman && styles.timestampHuman]}>
                      {formatThreadTime(entry.createdAt, language)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {pendingState === 'text_loading' && (
          <View style={[styles.bubbleRow, styles.bubbleRowHuman]}>
            <View style={[styles.bubble, styles.bubblePendingHuman]}>
              <Text style={styles.roleLabelHuman}>{strings.common.humanToCatSystem}</Text>
              <View style={styles.pendingRow}>
                <ActivityIndicator size="small" color="#0e0e14" />
                <Text style={styles.pendingTextHuman}>{strings.common.loadingTranslateText}</Text>
              </View>
            </View>
          </View>
        )}

        {pendingState === 'audio_loading' && (
          <View style={[styles.bubbleRow, styles.bubbleRowCat]}>
            <View style={[styles.bubble, styles.bubblePendingCat]}>
              <Text style={styles.roleLabel}>{strings.common.catToHumanSystem}</Text>
              <View style={styles.pendingRow}>
                <ActivityIndicator size="small" color="#a0e0c0" />
                <Text style={styles.pendingTextCat}>{strings.common.loadingAnalyzeAudio}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.composerWrap}>
        {pendingState === 'recording' && (
          <>
            <Text style={styles.recordingLabel}>{strings.common.recordingActive}</Text>
            <View style={styles.waveform}>
              {barAnims.map((anim, i) => (
                <Animated.View key={i} style={[styles.waveBar, { height: anim }]} />
              ))}
            </View>
          </>
        )}

        {permissionError && (
          <Text style={styles.permissionError}>{strings.common.micPermission}</Text>
        )}

        <View style={styles.composer}>
          <Animated.View style={[styles.recWrap, { opacity: pendingState === 'recording' ? pulseAnim : 1 }]}>
            <TouchableOpacity
              style={[
                styles.recButton,
                pendingState === 'recording' && styles.recButtonActive,
                (pendingState === 'text_loading' || pendingState === 'audio_loading') && styles.recButtonDisabled,
              ]}
              onPress={handleRecordPress}
              activeOpacity={0.75}
              disabled={pendingState === 'text_loading' || pendingState === 'audio_loading'}
            >
              <Text
                style={[
                  styles.recButtonText,
                  pendingState === 'recording' && styles.recButtonTextActive,
                  (pendingState === 'text_loading' || pendingState === 'audio_loading') &&
                    styles.recButtonTextDisabled,
                ]}
              >
                {pendingState === 'recording'
                  ? strings.common.stopLabel
                  : strings.common.recLabel}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={strings.conversation.inputPlaceholder}
              placeholderTextColor="#4a4a66"
              multiline
              numberOfLines={2}
              maxLength={200}
              textAlignVertical="center"
              editable={pendingState !== 'audio_loading' && pendingState !== 'recording'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend && pendingState === 'idle' ? styles.sendButtonReady : styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!canSend || pendingState !== 'idle'}
          >
            <Text
              style={[
                styles.sendButtonText,
                canSend && pendingState === 'idle'
                  ? styles.sendButtonTextReady
                  : styles.sendButtonTextDisabled,
              ]}
            >
              {strings.common.send}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0e0e14',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d28',
    backgroundColor: '#0e0e14',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  back: {
    paddingVertical: 4,
  },
  backText: {
    color: '#a0e0c0',
    fontSize: 15,
    letterSpacing: 1,
  },
  headerSignal: {
    color: '#5f7b6f',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#e8e8f0',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerStatus: {
    color: '#6a6a88',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  headerHint: {
    color: '#586271',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
    gap: 8,
  },
  emptyTitle: {
    color: '#a0e0c0',
    fontSize: 14,
    letterSpacing: 2,
  },
  emptyText: {
    color: '#5c5c74',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bubbleRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 12,
  },
  bubbleRowCat: {
    justifyContent: 'flex-start',
  },
  bubbleRowHuman: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  bubbleCat: {
    backgroundColor: '#171720',
    borderColor: '#2a2a3c',
  },
  bubbleHuman: {
    backgroundColor: '#a0e0c0',
    borderColor: '#a0e0c0',
  },
  bubblePendingCat: {
    backgroundColor: '#171720',
    borderColor: '#2a2a3c',
  },
  bubblePendingHuman: {
    backgroundColor: '#a0e0c0',
    borderColor: '#a0e0c0',
  },
  bubbleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleLabel: {
    color: '#7fba9f',
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'monospace',
  },
  roleLabelHuman: {
    color: '#24463a',
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'monospace',
  },
  bubbleSubtitle: {
    color: '#8080a8',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  bubbleSubtitleHuman: {
    color: '#24463a',
  },
  bubbleText: {
    color: '#e8e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextHuman: {
    color: '#0e0e14',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  moodTag: {
    color: '#a0e0c0',
    fontSize: 10,
    letterSpacing: 1.2,
    borderWidth: 1,
    borderColor: '#355242',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  moodTagHuman: {
    color: '#0e0e14',
    borderColor: '#5e8b77',
  },
  replayText: {
    color: '#7fcfaf',
    fontSize: 11,
    letterSpacing: 1,
  },
  analysisTag: {
    color: '#6ec0a3',
    fontSize: 10,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: '#2f4d42',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  replayTextHuman: {
    color: '#24463a',
  },
  timestamp: {
    color: '#66667e',
    fontSize: 10,
    marginLeft: 'auto',
  },
  timestampHuman: {
    color: '#355848',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  pendingTextHuman: {
    color: '#0e0e14',
    fontSize: 13,
  },
  pendingTextCat: {
    color: '#a0e0c0',
    fontSize: 13,
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#1d1d28',
    backgroundColor: '#0e0e14',
  },
  recordingLabel: {
    color: '#7fba9f',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 6,
  },
  waveform: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#a0e0c0',
    marginHorizontal: 2.5,
  },
  permissionError: {
    color: '#e05050',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  recWrap: {
    alignSelf: 'flex-end',
  },
  recButton: {
    minWidth: 78,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a0e0c0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171720',
  },
  recButtonActive: {
    backgroundColor: '#e05050',
    borderColor: '#e05050',
  },
  recButtonDisabled: {
    borderColor: '#2a2a3c',
  },
  recButtonText: {
    color: '#a0e0c0',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  recButtonTextActive: {
    color: '#ffffff',
  },
  recButtonTextDisabled: {
    color: '#4a4a66',
  },
  inputShell: {
    flex: 1,
    minHeight: 54,
    maxHeight: 110,
    backgroundColor: '#171720',
    borderWidth: 1,
    borderColor: '#2a2a3c',
    borderRadius: 18,
    justifyContent: 'center',
  },
  input: {
    minHeight: 54,
    maxHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#e8e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  sendButton: {
    alignSelf: 'flex-end',
    minWidth: 76,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonReady: {
    backgroundColor: '#a0e0c0',
    borderColor: '#a0e0c0',
  },
  sendButtonDisabled: {
    backgroundColor: '#171720',
    borderColor: '#2a2a3c',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sendButtonTextReady: {
    color: '#0e0e14',
  },
  sendButtonTextDisabled: {
    color: '#4a4a66',
  },
});

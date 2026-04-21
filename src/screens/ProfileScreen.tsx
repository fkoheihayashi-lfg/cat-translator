import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Keyboard } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import { useCat } from '../context/CatContext';
import {
  AppLanguage,
  getPersonalityLabel,
  getStrings,
  PERSONALITY_OPTIONS,
} from '../i18n/strings';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { profile, language, setLanguage, setProfile } = useCat();
  const strings = getStrings(language);
  const [catName, setCatName] = useState(profile.name);
  const [personality, setPersonality] = useState(profile.personality);
  const [nextLanguage, setNextLanguage] = useState<AppLanguage>(language);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    setNextLanguage(language);
  }, [language]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    Keyboard.dismiss();
    setProfile({ name: catName, personality });
    setSaved(true);
    saveTimeoutRef.current = setTimeout(() => {
      setSaved(false);
      isSavingRef.current = false;
      navigation.goBack();
    }, 900);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{strings.common.back}</Text>
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>{strings.profile.title}</Text>
          <Text style={styles.subtitle}>{strings.profile.subtitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{strings.profile.nameLabel}</Text>
          <TextInput
            style={styles.input}
            value={catName}
            onChangeText={setCatName}
            placeholder={strings.profile.namePlaceholder}
            placeholderTextColor="#4a4a66"
            maxLength={20}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{strings.profile.personalityLabel}</Text>
          <View style={styles.chips}>
            {PERSONALITY_OPTIONS.map((p) => {
              const selected = personality === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setPersonality(p)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {getPersonalityLabel(p, language)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{strings.profile.languageLabel}</Text>
          <Text style={styles.sectionHint}>{strings.profile.languageSubtitle}</Text>
          <View style={styles.chips}>
            {([
              { value: 'ja' as const, label: strings.profile.languageJa },
              { value: 'en' as const, label: strings.profile.languageEn },
            ] as const).map((item) => {
              const selected = nextLanguage === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setNextLanguage(item.value);
                    setLanguage(item.value);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saved}
        >
          <Text style={styles.saveButtonText}>{strings.common.save}</Text>
        </TouchableOpacity>

        {saved && <Text style={styles.savedConfirm}>{strings.common.saved}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e14',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
  },
  backText: {
    color: '#a0e0c0',
    fontSize: 15,
    letterSpacing: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#a0e0c0',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
  },
  subtitle: {
    color: '#6a6a88',
    fontSize: 13,
    letterSpacing: 1,
  },
  section: {
    width: '100%',
    gap: 6,
  },
  sectionHint: {
    color: '#5d5d72',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  label: {
    color: '#a0e0c0',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#a0e0c0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e8e8f0',
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a0e0c0',
    backgroundColor: '#1a1a24',
  },
  chipSelected: {
    backgroundColor: '#a0e0c0',
    borderColor: '#a0e0c0',
  },
  chipText: {
    color: '#a0e0c0',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#0e0e14',
    fontWeight: '700',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#a0e0c0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#0e0e14',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  savedConfirm: {
    color: '#a0e0c0',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

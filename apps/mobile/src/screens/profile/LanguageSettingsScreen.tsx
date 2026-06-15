import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';

const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { id: 'en', name: 'English (US)', nativeName: 'English' },
    { id: 'es', name: 'Spanish', nativeName: 'Español' },
    { id: 'fr', name: 'French', nativeName: 'Français' },
    { id: 'de', name: 'German', nativeName: 'Deutsch' },
    { id: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { id: 'it', name: 'Italian', nativeName: 'Italiano' },
    { id: 'ja', name: 'Japanese', nativeName: '日本語' },
    { id: 'ko', name: 'Korean', nativeName: '한국어' },
    { id: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.description}>
          Select the language you want to use PawSpace in.
        </Text>

        <View style={styles.section}>
          {languages.map((language, index) => (
            <React.Fragment key={language.id}>
              <TouchableOpacity
                style={styles.languageRow}
                onPress={() => setSelectedLanguage(language.id)}
                activeOpacity={0.7}
              >
                <View style={styles.languageLeft}>
                  <Text style={[styles.languageName, selectedLanguage === language.id && styles.activeLanguageName]}>
                    {language.name}
                  </Text>
                  <Text style={styles.languageNative}>{language.nativeName}</Text>
                </View>
                {selectedLanguage === language.id && (
                  <Icon name="checkmark" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              {index < languages.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.md,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backText: { fontSize: 17, color: COLORS.primary, marginLeft: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },
  description: {
    fontSize: FONT_SIZE.md, color: COLORS.textSecondary,
    marginBottom: SPACING.xl, marginTop: SPACING.md, lineHeight: 22,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, overflow: 'hidden', paddingHorizontal: SPACING.md, paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
  languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  languageLeft: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  activeLanguageName: { color: COLORS.primary },
  languageNative: { fontSize: 13, color: COLORS.textSecondary },
});

export default LanguageSettingsScreen;

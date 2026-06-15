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

const ThemeSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const themes = [
    { id: 'system', name: 'System Default', icon: 'phone-portrait-outline', desc: 'Match your device settings' },
    { id: 'light', name: 'Light', icon: 'sunny-outline', desc: 'Light color theme' },
    { id: 'dark', name: 'Dark', icon: 'moon-outline', desc: 'Dark color theme (Recommended)' },
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
        <Text style={styles.headerTitle}>Theme</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.description}>
          Choose how PawSpace looks to you.
        </Text>

        <View style={styles.section}>
          {themes.map((theme, index) => (
            <React.Fragment key={theme.id}>
              <TouchableOpacity
                style={styles.themeRow}
                onPress={() => setSelectedTheme(theme.id)}
                activeOpacity={0.7}
              >
                <View style={styles.themeLeft}>
                  <View style={[styles.iconSquare, { backgroundColor: selectedTheme === theme.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)' }]}>
                    <Icon name={theme.icon} size={20} color={selectedTheme === theme.id ? COLORS.primary : '#FFFFFF'} />
                  </View>
                  <View>
                    <Text style={[styles.themeName, selectedTheme === theme.id && styles.activeThemeName]}>{theme.name}</Text>
                    <Text style={styles.themeDesc}>{theme.desc}</Text>
                  </View>
                </View>
                {selectedTheme === theme.id && (
                  <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              {index < themes.length - 1 && <View style={styles.divider} />}
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
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  themeLeft: { flexDirection: 'row', alignItems: 'center' },
  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  themeName: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  activeThemeName: { color: COLORS.primary },
  themeDesc: { fontSize: 13, color: COLORS.textSecondary },
});

export default ThemeSettingsScreen;

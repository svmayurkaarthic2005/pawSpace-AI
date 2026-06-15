import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants';

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [allowMentions, setAllowMentions] = useState(true);
  const [allowMessageRequests, setAllowMessageRequests] = useState(true);
  const [hideLocation, setHideLocation] = useState(false);

  const renderToggleRow = (icon: string, color: string, label: string, subtext: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconSquare, { backgroundColor: color }]}>
          <Icon name={icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingSubtext}>{subtext}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionLabel}>ACCOUNT PRIVACY</Text>
        <View style={styles.section}>
          {renderToggleRow(
            'lock-closed-outline', 'rgba(20,184,166,0.2)',
            'Private Account',
            'Only approved followers can see your posts and pets.',
            isPrivate, setIsPrivate
          )}
        </View>

        <Text style={styles.sectionLabel}>INTERACTIONS</Text>
        <View style={styles.section}>
          {renderToggleRow(
            'chatbubbles-outline', 'rgba(59,130,246,0.2)',
            'Allow Message Requests',
            'Let anyone send you a message request.',
            allowMessageRequests, setAllowMessageRequests
          )}
          <View style={styles.divider} />
          {renderToggleRow(
            'at-outline', 'rgba(124,58,237,0.2)',
            'Allow Mentions',
            'Let anyone mention you in comments and posts.',
            allowMentions, setAllowMentions
          )}
        </View>

        <Text style={styles.sectionLabel}>ACTIVITY</Text>
        <View style={styles.section}>
          {renderToggleRow(
            'time-outline', 'rgba(251,191,36,0.2)',
            'Show Activity Status',
            'Let others see when you were last active.',
            showActivityStatus, setShowActivityStatus
          )}
          <View style={styles.divider} />
          {renderToggleRow(
            'location-outline', 'rgba(239,68,68,0.2)',
            'Hide Location on Posts',
            'Do not attach your city/location to new posts by default.',
            hideLocation, setHideLocation
          )}
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
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#6B7280', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: SPACING.lg, marginBottom: SPACING.sm, marginLeft: 4,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, overflow: 'hidden', paddingHorizontal: SPACING.md, paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTextContainer: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  settingSubtext: { fontSize: 13, color: COLORS.textSecondary, paddingRight: 8 },
  settingRight: { paddingLeft: 8 },
});

export default PrivacySettingsScreen;

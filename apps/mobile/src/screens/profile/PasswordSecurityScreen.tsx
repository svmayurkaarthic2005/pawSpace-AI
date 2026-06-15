import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';

const PasswordSecurityScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password & Security</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Change Password Section */}
        <Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>
        <View style={styles.section}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Icon name={showCurrent ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Icon name={showNew ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Icon name={showConfirm ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.updateBtn, (!currentPassword || !newPassword || !confirmPassword) && styles.disabledBtn]}
            onPress={handleUpdatePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.updateBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Two-Factor Authentication */}
        <Text style={styles.sectionLabel}>TWO-FACTOR AUTHENTICATION</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquare, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                <Icon name="phone-portrait-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Use Text Message (SMS)</Text>
                <Text style={styles.settingSubtext}>Receive a code on your phone</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Switch
                value={is2FAEnabled}
                onValueChange={setIs2FAEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
        
        <Text style={styles.footerInfo}>
          Adding two-factor authentication provides an extra layer of security to your PawSpace account.
        </Text>

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
    borderRadius: 16, overflow: 'hidden', padding: SPACING.md,
  },
  inputContainer: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text, marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12,
  },
  input: { flex: 1, height: 48, color: COLORS.text, fontSize: FONT_SIZE.md },
  updateBtn: {
    backgroundColor: COLORS.primary, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  disabledBtn: { backgroundColor: 'rgba(124,58,237,0.5)' },
  updateBtnText: { color: '#FFFFFF', fontSize: FONT_SIZE.md, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTextContainer: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  settingSubtext: { fontSize: 13, color: COLORS.textSecondary },
  settingRight: { paddingLeft: 8 },
  footerInfo: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 16, paddingHorizontal: 16 },
});

export default PasswordSecurityScreen;

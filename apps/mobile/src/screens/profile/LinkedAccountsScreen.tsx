import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';

const LinkedAccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isGoogleLinked, setIsGoogleLinked] = useState(true);
  const [isAppleLinked, setIsAppleLinked] = useState(false);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);

  const handleToggleLink = (provider: string, currentState: boolean, setter: (val: boolean) => void) => {
    if (currentState) {
      Alert.alert(
        'Unlink Account',
        `Are you sure you want to unlink your ${provider} account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlink', style: 'destructive', onPress: () => setter(false) },
        ]
      );
    } else {
      // Mock linking process
      Alert.alert(
        'Link Account',
        `You will be redirected to ${provider} to link your account.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => {
            // Mock success
            setTimeout(() => {
              setter(true);
              Alert.alert('Success', `Your ${provider} account has been linked successfully.`);
            }, 1000);
          } },
        ]
      );
    }
  };

  const renderProviderRow = (icon: string, color: string, provider: string, isLinked: boolean, setter: (val: boolean) => void) => (
    <View style={styles.providerRow}>
      <View style={styles.providerLeft}>
        <View style={[styles.iconSquare, { backgroundColor: color }]}>
          <Icon name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.providerName}>{provider}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.actionBtn, isLinked ? styles.unlinkBtn : styles.linkBtn]}
        onPress={() => handleToggleLink(provider, isLinked, setter)}
      >
        <Text style={[styles.actionBtnText, isLinked ? styles.unlinkBtnText : styles.linkBtnText]}>
          {isLinked ? 'Unlink' : 'Link'}
        </Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Linked Accounts</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.description}>
          Link your accounts to log in to PawSpace more easily and find your friends.
        </Text>

        <View style={styles.section}>
          {renderProviderRow('logo-google', '#DB4437', 'Google', isGoogleLinked, setIsGoogleLinked)}
          <View style={styles.divider} />
          {renderProviderRow('logo-apple', '#000000', 'Apple', isAppleLinked, setIsAppleLinked)}
          <View style={styles.divider} />
          {renderProviderRow('logo-facebook', '#1877F2', 'Facebook', isFacebookLinked, setIsFacebookLinked)}
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
  providerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  providerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  providerName: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  linkBtn: { backgroundColor: 'rgba(124,58,237,0.15)' },
  unlinkBtn: { backgroundColor: 'rgba(255,255,255,0.08)' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  linkBtnText: { color: COLORS.primary },
  unlinkBtnText: { color: COLORS.text },
});

export default LinkedAccountsScreen;

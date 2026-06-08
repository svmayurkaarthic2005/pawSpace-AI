import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

export const CreateCommunityScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Community</Text>
        <TouchableOpacity style={styles.createBtn} disabled>
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.message}>Create Community Screen</Text>
        <Text style={styles.note}>
          This screen will include a form with:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Community name input</Text>
          <Text style={styles.featureItem}>• Description (multiline)</Text>
          <Text style={styles.featureItem}>• Species multi-select</Text>
          <Text style={styles.featureItem}>• Tags (comma-separated)</Text>
          <Text style={styles.featureItem}>• Rules (optional)</Text>
          <Text style={styles.featureItem}>• Privacy toggle (public/private)</Text>
          <Text style={styles.featureItem}>• Avatar & cover image pickers</Text>
          <Text style={styles.featureItem}>• Accent color picker</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
});

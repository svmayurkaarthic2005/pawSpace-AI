import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type RouteParams = {
  EditCommunity: {
    communityId: string;
  };
};

export const EditCommunityScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'EditCommunity'>>();
  const navigation = useNavigation();
  const { communityId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Community</Text>
        <TouchableOpacity style={styles.saveBtn} disabled>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>Edit Community Screen</Text>
        <Text style={styles.subtitle}>Community ID: {communityId}</Text>
        <Text style={styles.note}>
          This screen will allow admins to edit community settings including name, description,
          rules, avatar, cover image, and accent color.
        </Text>
      </View>
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    textAlign: 'center',
  },
  note: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

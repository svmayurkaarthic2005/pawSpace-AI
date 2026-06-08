import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  title: string;
  aiLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, aiLabel }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {aiLabel && <Text style={styles.aiLabel}>{aiLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  aiLabel: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
  },
});

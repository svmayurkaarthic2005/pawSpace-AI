import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ParsedCaptionProps {
  text: string;
}

const ParsedCaption: React.FC<ParsedCaptionProps> = ({ text }) => {
  const navigation = useNavigation<any>();

  if (!text) return null;

  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, index) => {
        // Handle hashtags
        if (word.startsWith('#') && word.length > 1) {
          return (
            <Text
              key={index}
              style={styles.hashtag}
              onPress={() => navigation.navigate('HashtagFeed', { tag: word.slice(1) })}
            >
              {word}
            </Text>
          );
        }

        // Handle mentions
        if (word.startsWith('@') && word.length > 1) {
          return (
            <Text
              key={index}
              style={styles.mention}
              onPress={() => navigation.navigate('Profile', { username: word.slice(1) })}
            >
              {word}
            </Text>
          );
        }

        // Regular text
        return <Text key={index}>{word}</Text>;
      })}
    </>
  );
};

const styles = StyleSheet.create({
  hashtag: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  mention: {
    color: '#A78BFA',
    fontWeight: '500',
  },
});

export default ParsedCaption;

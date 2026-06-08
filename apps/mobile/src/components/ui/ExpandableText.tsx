import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  style?: TextStyle;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 3,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowMore, setShouldShowMore] = useState(false);

  return (
    <>
      <Text
        style={[styles.text, style]}
        numberOfLines={isExpanded ? undefined : maxLines}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > maxLines) {
            setShouldShowMore(true);
          }
        }}
      >
        {text}
      </Text>
      {shouldShowMore && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.moreText}>{isExpanded ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 20,
  },
  moreText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
    marginTop: 4,
  },
});

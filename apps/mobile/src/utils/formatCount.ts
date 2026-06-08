/**
 * Format count numbers
 * 1234 -> "1.2k", 84 -> "84", 1000000 -> "1M"
 */
export const formatCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1).replace('.0', '')}k`;
  return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
};

/**
 * Get species emoji
 */
export const getSpeciesEmoji = (species: string): string => {
  const emojiMap: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    bird: '🐦',
    rabbit: '🐇',
    fish: '🐠',
    reptile: '🦎',
    other: '🐾',
  };
  return emojiMap[species.toLowerCase()] || '🐾';
};

/**
 * Tiny nanoid-like unique ID generator for optimistic UI updates.
 * No external dependency needed.
 */
export const nanoid = (size = 21): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

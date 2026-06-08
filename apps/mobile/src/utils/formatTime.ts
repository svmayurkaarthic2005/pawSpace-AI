import { formatDistanceToNowStrict, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

/**
 * Format time as "9:41 AM"
 */
export const formatTime = (date: string | Date): string => {
  return format(new Date(date), 'h:mm a');
};

/**
 * Format relative time: "just now", "2m", "2h", "2d", "Jun 7"
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  // More than a week: show date
  if (isThisYear(d)) {
    return format(d, 'MMM d');
  }
  
  return format(d, 'MMM d, yyyy');
};

/**
 * Format date label for separators: "Today", "Yesterday", "June 7"
 */
export const formatDateLabel = (date: string | Date): string => {
  const d = new Date(date);
  
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  
  if (isThisYear(d)) {
    return format(d, 'MMMM d');
  }
  
  return format(d, 'MMMM d, yyyy');
};

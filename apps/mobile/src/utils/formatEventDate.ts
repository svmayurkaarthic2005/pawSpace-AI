function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatEventDate(dateString: string): string {
  const d = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today · ${formatTime(d)}`;
  }

  if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow · ${formatTime(d)}`;
  }

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${formatTime(d)}`;
}

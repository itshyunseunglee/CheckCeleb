export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return '0';
  const fmt = (val: number, suffix: string) => {
    const s = val.toFixed(1);
    return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix;
  };
  if (n >= 1_000_000_000) return fmt(n / 1_000_000_000, 'B');
  if (n >= 1_000_000) return fmt(n / 1_000_000, 'M');
  if (n >= 1_000) return fmt(n / 1_000, 'K');
  return n.toLocaleString();
}

export function isShortVideo(duration: string, title: string): boolean {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  // YouTube expanded Shorts max length to 3 minutes (180s) in Oct 2024
  return totalSeconds <= 180 || title.toLowerCase().includes('#shorts');
}

export function getDayName(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

export function truncateTitle(title: string, maxLen = 20): string {
  return title.length > maxLen ? title.slice(0, maxLen) + '…' : title;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
}

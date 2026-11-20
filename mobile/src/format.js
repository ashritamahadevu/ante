export function amount(baseUnits = 0) {
  const value = baseUnits / 1_000_000;
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

export function shortKey(key = "") {
  if (key.length < 10) return key;
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function timeLeft(end) {
  const ms = new Date(end).getTime() - Date.now();
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "Period ended";
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h left`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

export function periodProgress(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!s || !e || e <= s) return 0;
  return Math.max(0, Math.min(1, (Date.now() - s) / (e - s)));
}

export function timeAgo(date) {
  const ms = Date.now() - new Date(date).getTime();
  if (Number.isNaN(ms)) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

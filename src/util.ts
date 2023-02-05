export function chunk<T>(arr: T[], len: number) {
  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

export const convertToSeconds = (iso8601: string) => {
  const duration = iso8601.substring(2);
  const parts = duration.match(/(\d+H)?(\d+M)?(\d+S)?/);
  if (!parts) return 0;
  const [, hours, minutes, seconds] = parts;

  const hour = hours ? parseInt(hours) : 0;
  const minute = minutes ? parseInt(minutes) : 0;
  const second = seconds ? parseInt(seconds) : 0;

  const totalSeconds = hour * 3600 + minute * 60 + second;
  return totalSeconds;
};

export function secondsToDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
}

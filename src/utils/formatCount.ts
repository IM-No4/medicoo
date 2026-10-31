// 12 -> "12", 1480 -> "1.5K", 12000 -> "12K". Review counts were shown as "12K+" for twelve reviews because the suffix was part of the text.
export const formatCount = (value: unknown): string => {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n < 1000) return String(n);
  const thousands = n / 1000;
  return `${thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10}K`;
};

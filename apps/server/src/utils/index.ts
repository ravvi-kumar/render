export const toInt = (val: any, fallback = 0) => {
  const cleaned = String(val ?? "").replace(/\D/g, "");
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

export const toFloat = (val: any, fallback = 0) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};
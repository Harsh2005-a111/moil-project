export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const REGION_WRITE_KEY = process.env.REACT_APP_REGION_WRITE_KEY || "";

export function numberOr(value, fallback) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function indiaCoordinateOr(value, fallback) {
  return numberOr(value, fallback);
}

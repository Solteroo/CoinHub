import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtCoins(value: number | null | undefined): string {
  const n = Math.trunc(Number(value ?? 0));
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toString();
  const withSep = abs.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${withSep}`;
}

const TK_MONTHS = [
  "ýan", "few", "mart", "apr", "maý", "iýun",
  "iýul", "awg", "sen", "okt", "noý", "dek",
];

export const fmtDate = fmtDateShortImpl;

export function fmtDateShort(value: string | Date | null | undefined): string {
  return fmtDateShortImpl(value);
}

function fmtDateShortImpl(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = TK_MONTHS[d.getMonth()] ?? "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${hh}:${mm}`;
}

export function fmtCountdown(targetIso: string | null | undefined): string {
  if (!targetIso) return "00:00:00";
  const ms = new Date(targetIso).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

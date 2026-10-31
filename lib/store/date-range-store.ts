"use client";

import { create } from "zustand";
import { ANCHOR } from "@/lib/data/catalog";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "last90"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  start: string;
  end: string;
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function resolveRange(range: DateRangeValue): { start: Date; end: Date } {
  const today = startOfDay(ANCHOR);
  switch (range.preset) {
    case "today":
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case "yesterday": {
      const start = new Date(today.getTime() - 86400000);
      return { start, end: new Date(today.getTime() - 1) };
    }
    case "last7":
      return {
        start: new Date(today.getTime() - 6 * 86400000),
        end: new Date(today.getTime() + 86400000 - 1),
      };
    case "last30":
      return {
        start: new Date(today.getTime() - 29 * 86400000),
        end: new Date(today.getTime() + 86400000 - 1),
      };
    case "last90":
      return {
        start: new Date(today.getTime() - 89 * 86400000),
        end: new Date(today.getTime() + 86400000 - 1),
      };
    case "this_month":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getTime() + 86400000 - 1),
      };
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "custom":
    default: {
      const start = new Date(range.start || today.toISOString());
      const end = new Date(range.end || today.toISOString());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (start > end) return { start: end, end: start };
      return { start, end };
    }
  }
}

export function previousRange(range: DateRangeValue) {
  const { start, end } = resolveRange(range);
  const span = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - span - 1),
    end: new Date(start.getTime() - 1),
  };
}

interface DateRangeStore {
  range: DateRangeValue;
  setPreset: (preset: DateRangePreset) => void;
  setCustom: (start: string, end: string) => void;
}

export const useDateRangeStore = create<DateRangeStore>((set) => ({
  range: { preset: "last30", start: "", end: "" },
  setPreset: (preset) => set({ range: { preset, start: "", end: "" } }),
  setCustom: (start, end) => set({ range: { preset: "custom", start, end } }),
}));

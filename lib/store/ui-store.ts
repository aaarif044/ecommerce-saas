"use client";

import { create } from "zustand";
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/services/storage";

export type ThemeMode = "light" | "dark" | "system";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info" | "warning";
}

interface UIState {
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  cartDrawerOpen: boolean;
  toasts: ToastMessage[];
  setThemeMode: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  toast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  hydrate: () => void;
  reset: () => void;
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export const useUIStore = create<UIState>((set, get) => ({
  themeMode: "system",
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileNavOpen: false,
  cartDrawerOpen: false,
  toasts: [],
  setThemeMode: (mode) => {
    applyTheme(mode);
    writeStorage(STORAGE_KEYS.theme, mode);
    set({ themeMode: mode });
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    writeStorage(STORAGE_KEYS.sidebar, next);
    set({ sidebarCollapsed: next });
  },
  setSidebarCollapsed: (collapsed) => {
    writeStorage(STORAGE_KEYS.sidebar, collapsed);
    set({ sidebarCollapsed: collapsed });
  },
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  toast: (toast) => {
    const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 4600);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  hydrate: () => {
    const themeMode = readStorage<ThemeMode>(STORAGE_KEYS.theme, "system");
    const sidebarCollapsed = readStorage<boolean>(STORAGE_KEYS.sidebar, false);
    applyTheme(themeMode);
    set({ themeMode, sidebarCollapsed });
  },
  reset: () => {
    applyTheme("system");
    set({
      themeMode: "system",
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      mobileNavOpen: false,
      cartDrawerOpen: false,
      toasts: [],
    });
  },
}));

export { applyTheme };

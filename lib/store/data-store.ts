"use client";

import { create } from "zustand";
import { SEED, type SeedData } from "@/lib/data";
import { normaliseSettings } from "@/lib/data/settings";
import { STORAGE_KEYS, clearDemoStorage, readStorage, writeStorage } from "@/lib/services/storage";
import { DEMO_STORES } from "@/lib/data";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/lib/store/ui-store";

export interface DataState extends SeedData {
  hydrated: boolean;
  activeStoreId: string;
  setActiveStore: (storeId: string) => void;
  patch: (partial: Partial<SeedData>) => void;
  replace: (data: SeedData) => void;
  hydrate: () => void;
  resetDemoData: () => void;
}

type PersistedSlice = Omit<SeedData, "demoStores"> & { activeStoreId: string };

export const useDataStore = create<DataState>((set) => {
  const persist = (state: DataState) => {
    const payload = {
      categories: state.categories,
      collections: state.collections,
      products: state.products,
      customers: state.customers,
      orders: state.orders,
      payments: state.payments,
      shipments: state.shipments,
      returns: state.returns,
      abandonedCarts: state.abandonedCarts,
      inventoryMovements: state.inventoryMovements,
      discounts: state.discounts,
      staff: state.staff,
      notifications: state.notifications,
      themes: state.themes,
      pages: state.pages,
      blogPosts: state.blogPosts,
      navMenus: state.navMenus,
      campaigns: state.campaigns,
      integrations: state.integrations,
      plans: state.plans,
      invoices: state.invoices,
      merchants: state.merchants,
      auditLog: state.auditLog,
      platformSettings: state.platformSettings,
      shippingZones: state.shippingZones,
      taxSettings: state.taxSettings,
      emailTemplates: state.emailTemplates,
      customDomains: state.customDomains,
      analytics: state.analytics,
      settingsByStore: state.settingsByStore,
      activeStoreId: state.activeStoreId,
    } satisfies PersistedSlice;
    writeStorage(STORAGE_KEYS.dataset, payload);
  };

  return {
    ...SEED,
    hydrated: false,
    activeStoreId: DEMO_STORES[0].id,

    setActiveStore: (storeId) => {
      set((state) => {
        const next = { ...state, activeStoreId: storeId };
        persist(next);
        return next;
      });
    },

    patch: (partial) => {
      set((state) => {
        const next = { ...state, ...partial };
        persist(next);
        return next;
      });
    },

    replace: (data) => {
      set((state) => {
        const next = { ...state, ...data };
        persist(next);
        return next;
      });
    },

    hydrate: () => {
      const stored = readStorage<PersistedSlice | null>(STORAGE_KEYS.dataset, null);
      if (stored && Array.isArray(stored.products) && Array.isArray(stored.orders)) {
        set((state) => {
          // Merge persisted settings over the defaults so snapshots written
          // before a settings section existed still load cleanly.
          const merged = { ...state.settingsByStore, ...(stored.settingsByStore ?? {}) };
          const settingsByStore = Object.fromEntries(
            Object.entries(merged).map(([id, bundle]) => {
              const base =
                SEED.settingsByStore[id] ?? SEED.settingsByStore[DEMO_STORES[0].id];
              return [id, normaliseSettings(base, bundle)];
            }),
          );

          return {
            ...state,
            ...stored,
            demoStores: DEMO_STORES,
            settingsByStore,
            hydrated: true,
          };
        });
        return;
      }
      set((state) => ({ ...state, hydrated: true }));
    },

    resetDemoData: () => {
      clearDemoStorage();
      // The cart and the display preferences live in their own stores. They
      // have to be reset too, otherwise "reset everything" leaves the cart
      // and the colour theme in place until the page is reloaded.
      useCartStore.getState().clear();
      useUIStore.getState().reset();
      set((state) => {
        const next: DataState = {
          ...SEED,
          hydrated: true,
          activeStoreId: DEMO_STORES[0].id,
          setActiveStore: state.setActiveStore,
          patch: state.patch,
          replace: state.replace,
          hydrate: state.hydrate,
          resetDemoData: state.resetDemoData,
        };
        persist(next);
        return next;
      });
    },
  };
});

/* ----------------------------- selectors ----------------------------- */

export function useActiveStoreId() {
  return useDataStore((state) => state.activeStoreId);
}

export function useStoreSettings() {
  return useDataStore(
    (state) => state.settingsByStore[state.activeStoreId] ?? state.settingsByStore[DEMO_STORES[0].id],
  );
}

export function useRegionalSettings() {
  return useStoreSettings().regional;
}

export function useActiveTheme() {
  return useDataStore((state) => {
    const storeThemes = state.themes;
    return storeThemes.find((theme) => theme.isActive) ?? storeThemes[0];
  });
}

export function getStoreSettings() {
  const state = useDataStore.getState();
  return state.settingsByStore[state.activeStoreId] ?? state.settingsByStore[DEMO_STORES[0].id];
}

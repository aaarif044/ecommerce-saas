"use client";

import * as React from "react";
import { useDataStore } from "@/lib/store/data-store";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/lib/store/ui-store";

/**
 * Hydrates every demo store from localStorage after the first paint.
 * The server render always uses the deterministic fixtures, so there is never
 * a hydration mismatch — persisted edits are applied a tick later.
 */
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const hydrateData = useDataStore((state) => state.hydrate);
  const hydrateCart = useCartStore((state) => state.hydrate);
  const hydrateUI = useUIStore((state) => state.hydrate);

  React.useEffect(() => {
    hydrateUI();
    hydrateData();
    hydrateCart();
  }, [hydrateData, hydrateCart, hydrateUI]);

  return <>{children}</>;
}

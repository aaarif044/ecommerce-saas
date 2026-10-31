"use client";

import type { Merchant, SubscriptionPlan } from "@/lib/types";
import { useDataStore } from "@/lib/store/data-store";
import { MockApiError, simulateLatency } from "./errors";

export const merchantService = {
  async list(): Promise<Merchant[]> {
    await simulateLatency(110, 120);
    return useDataStore.getState().merchants;
  },
  async updateStatus(id: string, status: Merchant["status"]): Promise<Merchant> {
    await simulateLatency(220, 140);
    const state = useDataStore.getState();
    const merchant = state.merchants.find((item) => item.id === id);
    if (!merchant) throw new MockApiError("Merchant not found.", "not_found", 404);
    const updated: Merchant = { ...merchant, status };
    state.patch({ merchants: state.merchants.map((item) => (item.id === id ? updated : item)) });
    state.patch({
      auditLog: [
        {
          id: `aud-${Date.now().toString(36)}`,
          actor: "Platform admin (demo)",
          action: `merchant.${status}`,
          target: merchant.businessName,
          targetType: "Merchant",
          createdAt: new Date().toISOString(),
          ip: "10.4.12.88",
          severity: status === "suspended" ? "critical" : "info",
        },
        ...state.auditLog,
      ],
    });
    return updated;
  },
  async changePlan(id: string, planId: string): Promise<Merchant> {
    await simulateLatency();
    const state = useDataStore.getState();
    const merchant = state.merchants.find((item) => item.id === id);
    const plan = state.plans.find((item) => item.id === planId);
    if (!merchant) throw new MockApiError("Merchant not found.", "not_found", 404);
    if (!plan) throw new MockApiError("Plan not found.", "not_found", 404);
    const updated: Merchant = { ...merchant, planId, planName: plan.name };
    state.patch({ merchants: state.merchants.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
};

export const planService = {
  async list(): Promise<SubscriptionPlan[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().plans;
  },
  async create(input: Omit<SubscriptionPlan, "id" | "subscribers">): Promise<SubscriptionPlan> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.name.trim()) throw new MockApiError("Plan name is required.", "validation");
    const plan: SubscriptionPlan = { ...input, id: `plan-${Date.now().toString(36)}`, subscribers: 0 };
    state.patch({ plans: [...state.plans, plan] });
    return plan;
  },
  async update(id: string, input: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    await simulateLatency();
    const state = useDataStore.getState();
    const plan = state.plans.find((item) => item.id === id);
    if (!plan) throw new MockApiError("Plan not found.", "not_found", 404);
    const updated = { ...plan, ...input };
    state.patch({ plans: state.plans.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (state.plans.filter((plan) => plan.id !== id).length === 0) {
      throw new MockApiError("At least one plan must remain.", "conflict", 409);
    }
    state.patch({ plans: state.plans.filter((item) => item.id !== id) });
  },
};

export const platformService = {
  async updateSettings(input: Partial<ReturnType<typeof useDataStore.getState>["platformSettings"]>) {
    await simulateLatency();
    const state = useDataStore.getState();
    const updated = { ...state.platformSettings, ...input };
    state.patch({
      platformSettings: updated,
      // The screen promises that saving writes an audit entry, so it has to.
      auditLog: [
        {
          id: `aud-${Date.now().toString(36)}`,
          actor: "Platform admin (demo)",
          action: "settings.updated",
          target: "Platform settings",
          targetType: "Platform settings",
          createdAt: new Date().toISOString(),
          ip: "10.4.12.88",
          severity: "warning" as const,
        },
        ...state.auditLog,
      ],
    });
    return updated;
  },
  async auditLog() {
    await simulateLatency(90, 90);
    return useDataStore.getState().auditLog;
  },
};

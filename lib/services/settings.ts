"use client";

import type {
  BillingInvoice,
  CustomDomain,
  EmailTemplate,
  NotificationPreferences,
  StaffMember,
  StoreSettingsBundle,
  SubscriptionState,
} from "@/lib/types";
import { SEED } from "@/lib/data";
import { useDataStore } from "@/lib/store/data-store";
import { MockApiError, simulateLatency } from "./errors";

function updateSettings(updater: (settings: StoreSettingsBundle) => StoreSettingsBundle) {
  const state = useDataStore.getState();
  const current = state.settingsByStore[state.activeStoreId];
  if (!current) throw new MockApiError("Store settings not found.", "not_found", 404);
  const next = updater(current);
  state.patch({
    settingsByStore: { ...state.settingsByStore, [state.activeStoreId]: next },
  });
  return next;
}

export const settingsService = {
  async get(): Promise<StoreSettingsBundle> {
    await simulateLatency(90, 90);
    const state = useDataStore.getState();
    return state.settingsByStore[state.activeStoreId];
  },

  async updateGeneral(input: Partial<StoreSettingsBundle["general"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      general: { ...settings.general, ...input },
    })).general;
  },

  async updateRegional(input: Partial<StoreSettingsBundle["regional"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      regional: { ...settings.regional, ...input },
    })).regional;
  },

  async updateNotifications(input: Partial<NotificationPreferences>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      notifications: { ...settings.notifications, ...input },
    })).notifications;
  },

  async updateEmail(input: Partial<StoreSettingsBundle["email"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      email: { ...settings.email, ...input },
    })).email;
  },

  async updateStorefront(input: Partial<StoreSettingsBundle["storefront"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      storefront: { ...settings.storefront, ...input },
    })).storefront;
  },

  async updateCheckout(input: Partial<StoreSettingsBundle["checkout"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      checkout: { ...settings.checkout, ...input },
    })).checkout;
  },

  async updatePayments(input: Partial<StoreSettingsBundle["payments"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      payments: { ...settings.payments, ...input },
    })).payments;
  },

  async updateShipping(input: Partial<StoreSettingsBundle["shipping"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      shipping: { ...settings.shipping, ...input },
    })).shipping;
  },

  async updateTaxes(input: Partial<StoreSettingsBundle["taxes"]>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      taxes: { ...settings.taxes, ...input },
    })).taxes;
  },

  async updateSubscription(input: Partial<SubscriptionState>) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      subscription: { ...settings.subscription, ...input },
    })).subscription;
  },

  async changePlan(planId: string, billingCycle: "monthly" | "annual") {
    await simulateLatency(260, 160);
    const state = useDataStore.getState();
    const plan = state.plans.find((item) => item.id === planId);
    if (!plan) throw new MockApiError("Plan not found.", "not_found", 404);
    const amount = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
    // The number is derived from the invoices that already exist for this
    // store, otherwise every plan change would issue the same invoice number.
    const existing = state.settingsByStore[state.activeStoreId]?.invoices ?? [];
    const highest = existing.reduce((max, invoice) => {
      const match = /INV-(\d+)-(\d+)/.exec(invoice.number);
      return match ? Math.max(max, Number(match[2])) : max;
    }, 1099);
    const invoice: BillingInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      number: `INV-2026-${String(highest + 1)}`,
      date: new Date().toISOString(),
      amount,
      currency: "INR",
      status: "paid",
      planName: plan.name,
      description: `${plan.name} plan — ${billingCycle} billing (demo)`,
    };
    const subscription = updateSettings((settings) => ({
      ...settings,
      subscription: {
        ...settings.subscription,
        planId,
        billingCycle,
        status: "active",
        renewsAt: new Date(Date.now() + (billingCycle === "annual" ? 365 : 30) * 86400000).toISOString(),
      },
      invoices: [invoice, ...settings.invoices],
    }));
    return { subscription, invoice };
  },

  async cancelSubscription() {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      subscription: { ...settings.subscription, status: "cancelled" },
    })).subscription;
  },

  async inviteStaff(member: {
    name: string;
    email: string;
    role: StaffMember["role"];
  }): Promise<StaffMember> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (state.settingsByStore[state.activeStoreId].staff.some((s) => s.email === member.email)) {
      throw new MockApiError("A staff member with that email already exists.", "conflict", 409);
    }
    const staff: StaffMember = {
      id: `stf-${Date.now().toString(36)}`,
      name: member.name,
      email: member.email,
      role: member.role,
      status: "invited",
      lastActiveAt: null,
      createdAt: new Date().toISOString(),
      permissions: [],
    };
    updateSettings((settings) => ({ ...settings, staff: [...settings.staff, staff] }));
    return staff;
  },

  async updateStaff(id: string, input: Partial<StaffMember>): Promise<StaffMember> {
    await simulateLatency();
    let updated: StaffMember | undefined;
    updateSettings((settings) => ({
      ...settings,
      staff: settings.staff.map((member) => {
        if (member.id !== id) return member;
        updated = { ...member, ...input };
        return updated;
      }),
    }));
    if (!updated) throw new MockApiError("Staff member not found.", "not_found", 404);
    return updated;
  },

  async removeStaff(id: string): Promise<void> {
    await simulateLatency();
    updateSettings((settings) => ({
      ...settings,
      staff: settings.staff.filter((member) => member.id !== id),
    }));
  },

  async addCustomRole(role: { name: string; description: string; permissions: string[] }) {
    await simulateLatency();
    return updateSettings((settings) => ({
      ...settings,
      customRoles: [
        ...settings.customRoles,
        { ...role, id: `role-${Date.now().toString(36)}` },
      ],
    })).customRoles;
  },

  async removeCustomRole(id: string) {
    await simulateLatency();
    updateSettings((settings) => ({
      ...settings,
      customRoles: settings.customRoles.filter((role) => role.id !== id),
    }));
  },

  /* --------------------------- Custom domain ------------------------- */

  async addDomain(hostname: string): Promise<CustomDomain> {
    await simulateLatency(400, 200);
    const state = useDataStore.getState();
    const clean = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean || !clean.includes(".")) {
      throw new MockApiError("Enter a valid domain, for example shop.yourbrand.com.", "validation");
    }
    if (state.customDomains.some((domain) => domain.hostname === clean)) {
      throw new MockApiError("That domain is already connected.", "conflict", 409);
    }
    // One token, used for the record and published as the TXT value, so the
    // value the merchant is told to publish is the value that is checked.
    const verificationToken = `nw-${Math.random().toString(36).slice(2, 10)}`;
    const domain: CustomDomain = {
      id: `dom-${Date.now().toString(36)}`,
      hostname: clean,
      isPrimary: state.customDomains.length === 0,
      status: "pending",
      sslStatus: "pending",
      verificationToken,
      createdAt: new Date().toISOString(),
      lastCheckedAt: null,
      dnsRecords: [
        {
          type: "CNAME",
          name: clean.split(".")[0],
          value: "domains.trellis.example",
          verified: false,
        },
        {
          type: "TXT",
          name: `_trellis.${clean}`,
          value: verificationToken,
          verified: false,
        },
      ],
    };
    state.patch({ customDomains: [...state.customDomains, domain] });
    return domain;
  },

  async verifyDomain(id: string): Promise<CustomDomain> {
    await simulateLatency(700, 300);
    const state = useDataStore.getState();
    const domain = state.customDomains.find((item) => item.id === id);
    if (!domain) throw new MockApiError("Domain not found.", "not_found", 404);
    const updated: CustomDomain = {
      ...domain,
      status: "verified",
      sslStatus: "active",
      lastCheckedAt: new Date().toISOString(),
      dnsRecords: domain.dnsRecords.map((record) => ({ ...record, verified: true })),
    };
    state.patch({ customDomains: state.customDomains.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },

  async setPrimaryDomain(id: string): Promise<CustomDomain> {
    await simulateLatency();
    const state = useDataStore.getState();
    const domain = state.customDomains.find((item) => item.id === id);
    if (!domain) throw new MockApiError("Domain not found.", "not_found", 404);
    const updated = state.customDomains.map((item) => ({
      ...item,
      isPrimary: item.id === id,
    }));
    state.patch({ customDomains: updated });
    return updated.find((item) => item.id === id)!;
  },

  async removeDomain(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    const remaining = state.customDomains.filter((item) => item.id !== id);
    const updated = remaining.map((item, index) => ({ ...item, isPrimary: index === 0 }));
    state.patch({ customDomains: updated });
  },
};

export const emailTemplateService = {
  async list() {
    await simulateLatency(90, 90);
    return useDataStore.getState().emailTemplates;
  },
  async update(id: string, input: Partial<EmailTemplate>): Promise<EmailTemplate> {
    await simulateLatency();
    const state = useDataStore.getState();
    const template = state.emailTemplates.find((item) => item.id === id);
    if (!template) throw new MockApiError("Email template not found.", "not_found", 404);
    const updated = { ...template, ...input };
    state.patch({
      emailTemplates: state.emailTemplates.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  },
  async reset(id: string): Promise<EmailTemplate> {
    await simulateLatency();
    const state = useDataStore.getState();
    const original = SEED.emailTemplates.find((item) => item.id === id);
    if (!original) throw new MockApiError("Template not found.", "not_found", 404);
    state.patch({
      emailTemplates: state.emailTemplates.map((item) => (item.id === id ? { ...original } : item)),
    });
    return original;
  },
};

"use client";

import {  } from "@/lib/hooks";
import * as React from "react";
import { Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { CurrencyCode, RegionalSettings } from "@/lib/types";

const COUNTRIES = [
  { name: "India", code: "IN", currency: "INR" as CurrencyCode },
  { name: "United Kingdom", code: "GB", currency: "GBP" as CurrencyCode },
  { name: "United States", code: "US", currency: "USD" as CurrencyCode },
  { name: "Ireland", code: "IE", currency: "EUR" as CurrencyCode },
  { name: "Germany", code: "DE", currency: "EUR" as CurrencyCode },
  { name: "United Arab Emirates", code: "AE", currency: "AED" as CurrencyCode },
  { name: "Singapore", code: "SG", currency: "SGD" as CurrencyCode },
];

const STATES: Record<string, string[]> = {
  IN: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "West Bengal", "Gujarat", "Kerala", "Rajasthan"],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
  US: ["California", "New York", "Texas", "Washington", "Illinois"],
  IE: ["Leinster", "Munster", "Connacht", "Ulster"],
  DE: ["Bavaria", "Berlin", "Hesse", "Saxony"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
  SG: ["Central Region", "East Region", "West Region", "North Region"],
};

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
};

export default function RegionalSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);
  const [form, setForm] = React.useState<RegionalSettings>(settings.regional);
  const [saving, setSaving] = React.useState(false);

  const update = (patch: Partial<RegionalSettings>) => setForm((current) => ({ ...current, ...patch }));

  const preview = {
    money: formatMoney(128450.5, {
      currency: form.currency,
      locale: form.numberLocale,
      symbol: form.currencySymbol,
      symbolFirst: form.currencyFormat === "symbol_first",
      decimals: form.currencyDecimals,
    }),
    date: formatDate("2026-10-20T09:45:00.000Z", {
      dateFormat: form.dateFormat,
      timeFormat: form.timeFormat,
      timeZone: form.timezone,
    }),
    dateTime: formatDate("2026-10-20T09:45:00.000Z", {
      dateFormat: form.dateFormat,
      timeFormat: form.timeFormat,
      timeZone: form.timezone,
      withTime: true,
    }),
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateRegional(form);
      toast({
        variant: "success",
        title: "Regional preferences saved",
        description: "Dates, times and prices now use the new format.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Regional preferences"
      description="Currency, language and time formatting. Existing orders keep their original currency."
    >
      <Page gap="sm">
        <Card>
          <CardHeader title="Location" description="Where the store is based." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" htmlFor="region-country">
              <Select
                id="region-country"
                value={form.countryCode}
                onChange={(event) => {
                  const country = COUNTRIES.find((item) => item.code === event.target.value);
                  if (!country) return;
                  update({
                    countryCode: country.code,
                    country: country.name,
                    currency: country.currency,
                    currencySymbol: CURRENCY_SYMBOLS[country.currency],
                    state: STATES[country.code]?.[0] ?? "",
                  });
                }}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="State or province" htmlFor="region-state">
              <Select
                id="region-state"
                value={form.state}
                onChange={(event) => update({ state: event.target.value })}
              >
                {(STATES[form.countryCode] ?? []).map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Currency" description="Used for all new prices and totals." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Default currency" htmlFor="region-currency">
              <Select
                id="region-currency"
                value={form.currency}
                onChange={(event) => {
                  const code = event.target.value as CurrencyCode;
                  update({ currency: code, currencySymbol: CURRENCY_SYMBOLS[code] });
                }}
              >
                {Object.keys(CURRENCY_SYMBOLS).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency symbol" htmlFor="region-symbol">
              <Input
                id="region-symbol"
                value={form.currencySymbol}
                onChange={(event) => update({ currencySymbol: event.target.value })}
                className="w-24"
              />
            </Field>
            <Field label="Symbol position" htmlFor="region-format">
              <Select
                id="region-format"
                value={form.currencyFormat}
                onChange={(event) =>
                  update({ currencyFormat: event.target.value as RegionalSettings["currencyFormat"] })
                }
              >
                <option value="symbol_first">Symbol first — ₹1,234</option>
                <option value="symbol_last">Symbol last — 1,234 ₹</option>
              </Select>
            </Field>
            <Field label="Decimal places" htmlFor="region-decimals">
              <Select
                id="region-decimals"
                value={String(form.currencyDecimals)}
                onChange={(event) => update({ currencyDecimals: Number(event.target.value) })}
              >
                <option value="0">0 — ₹1,235</option>
                <option value="2">2 — ₹1,234.50</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Language and time" description="Formatting rules applied everywhere." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Display language" htmlFor="region-language">
              <Select
                id="region-language"
                value={form.language}
                onChange={(event) => update({ language: event.target.value })}
              >
                <option value="en-IN">English (India)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="en-US">English (United States)</option>
                <option value="en-IE">English (Ireland)</option>
                <option value="en-SG">English (Singapore)</option>
                <option value="hi-IN">हिन्दी (India)</option>
                <option value="ar-AE">العربية (UAE)</option>
              </Select>
            </Field>
            <Field label="Number formatting locale" htmlFor="region-number-locale">
              <Select
                id="region-number-locale"
                value={form.numberLocale}
                onChange={(event) => update({ numberLocale: event.target.value })}
              >
                <option value="en-IN">en-IN — 1,23,456</option>
                <option value="en-US">en-US — 123,456</option>
                <option value="en-GB">en-GB — 123,456</option>
                <option value="de-DE">de-DE — 123.456</option>
                <option value="en-SG">en-SG — 123,456</option>
              </Select>
            </Field>
            <Field label="IANA timezone" htmlFor="region-timezone">
              <Select
                id="region-timezone"
                value={form.timezone}
                onChange={(event) => update({ timezone: event.target.value })}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date format" htmlFor="region-date-format">
              <Select
                id="region-date-format"
                value={form.dateFormat}
                onChange={(event) =>
                  update({ dateFormat: event.target.value as RegionalSettings["dateFormat"] })
                }
              >
                <option value="dd/MM/yyyy">31/12/2026</option>
                <option value="MM/dd/yyyy">12/31/2026</option>
                <option value="yyyy-MM-dd">2026-12-31</option>
                <option value="dd MMM yyyy">31 Dec 2026</option>
              </Select>
            </Field>
            <Field label="Time format" htmlFor="region-time-format">
              <Select
                id="region-time-format"
                value={form.timeFormat}
                onChange={(event) =>
                  update({ timeFormat: event.target.value as RegionalSettings["timeFormat"] })
                }
              >
                <option value="12h">12-hour — 09:45 PM</option>
                <option value="24h">24-hour — 21:45</option>
              </Select>
            </Field>
            <Field label="Week starts on" htmlFor="region-week-start">
              <Select
                id="region-week-start"
                value={form.weekStart}
                onChange={(event) =>
                  update({ weekStart: event.target.value as RegionalSettings["weekStart"] })
                }
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Live preview" description="Rendered with Intl.NumberFormat and Intl.DateTimeFormat." />
          <CardBody>
            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Amount", value: preview.money },
                { label: "Date", value: preview.date },
                { label: "Date and time", value: preview.dateTime },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-surface-2 p-3">
                  <dt className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-md font-medium tabular-nums text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-subtle">
              Historical orders keep the currency they were created with — only the display format
              changes.
            </p>
          </CardBody>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge tone="info">Changes apply across the dashboard and storefront</Badge>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save preferences
          </Button>
        </div>
      </Page>
    </SettingsLayout>
  );
}

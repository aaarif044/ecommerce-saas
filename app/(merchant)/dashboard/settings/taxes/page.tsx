"use client";

import * as React from "react";
import { Calculator, Plus, Save, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useSyncedState } from "@/lib/hooks";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input, Select } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import type { TaxCategory, TaxRule } from "@/lib/types";

export default function TaxSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const products = useDataStore((state) => state.products);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();

  const [form, setForm] = useSyncedState(settings.taxes);
  const [saving, setSaving] = React.useState(false);
  const [previewAmount, setPreviewAmount] = React.useState(1999);

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateTaxes(form);
      toast({ variant: "success", title: "Tax settings saved" });
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

  const updateCategory = (id: string, patch: Partial<TaxCategory>) => {
    setForm((current) => ({
      ...current,
      taxCategories: current.taxCategories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    }));
  };

  const updateRule = (id: string, patch: Partial<TaxRule>) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    }));
  };

  const primaryCategory = form.taxCategories[0];
  const previewTax = primaryCategory ? (previewAmount * primaryCategory.rate) / 100 : 0;

  return (
    <SettingsLayout
      title="Tax settings"
      description="Illustrative tax configuration. The rates below are examples only and are not a statement of current law."
    >
      <Page gap="sm">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="flex items-center gap-2 font-medium">
            <Calculator className="size-4 shrink-0" aria-hidden />
            Illustrative rates only
          </p>
          <p className="mt-1 leading-5">
            These percentages are sample values for demonstration. They are not legally current and
            must not be used for real tax filings.
          </p>
        </div>

        <Card>
          <CardHeader title="Tax region" description="Where the store applies tax." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" htmlFor="tax-country">
              <Input
                id="tax-country"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              />
            </Field>
            <Field label="State or province" htmlFor="tax-state">
              <Input
                id="tax-state"
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Switch
                checked={form.pricesIncludeTax}
                onCheckedChange={(checked) => setForm({ ...form, pricesIncludeTax: checked })}
                label="Prices include tax"
                description="When enabled, tax is extracted from the displayed price rather than added at checkout."
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Tax categories"
            description="Each product is assigned to a category that determines its rate."
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    taxCategories: [
                      ...current.taxCategories,
                      {
                        id: `tax-${Date.now().toString(36)}`,
                        name: "New category",
                        rate: 12,
                        compound: false,
                        includedInPrice: false,
                        effectiveFrom: new Date().toISOString().slice(0, 10),
                        productIds: [],
                      },
                    ],
                  }))
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Add category
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {form.taxCategories.map((category) => (
              <div key={category.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={category.name}
                    aria-label={`Name for ${category.name}`}
                    onChange={(event) =>
                      updateCategory(category.id, { name: event.target.value })
                    }
                    className="max-w-56 font-medium"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={category.rate}
                      aria-label={`Rate for ${category.name}`}
                      onChange={(event) =>
                        updateCategory(category.id, { rate: Number(event.target.value) })
                      }
                      className="w-24 text-right"
                    />
                    <span className="text-sm text-ink-muted">%</span>
                  </div>
                  <Input
                    type="date"
                    value={category.effectiveFrom}
                    aria-label={`Effective date for ${category.name}`}
                    onChange={(event) =>
                      updateCategory(category.id, { effectiveFrom: event.target.value })
                    }
                    className="w-44"
                  />
                  <div className="ml-auto flex items-center gap-1.5">
                    {category.compound ? <Badge tone="info">Compound</Badge> : null}
                    {category.includedInPrice ? <Badge tone="neutral">Price inclusive</Badge> : null}
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Remove ${category.name}`}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          taxCategories: current.taxCategories.filter(
                            (item) => item.id !== category.id,
                          ),
                        }))
                      }
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Switch
                    checked={category.compound}
                    onCheckedChange={(checked) =>
                      updateCategory(category.id, { compound: checked })
                    }
                    label="Compound"
                  />
                  <Switch
                    checked={category.includedInPrice}
                    onCheckedChange={(checked) =>
                      updateCategory(category.id, { includedInPrice: checked })
                    }
                    label="Inclusive of price"
                  />
                </div>
                <Field
                  label={`Products in this category (${category.productIds.length})`}
                  className="mt-3"
                >
                  <select
                    multiple
                    value={category.productIds}
                    onChange={(event) =>
                      updateCategory(category.id, {
                        productIds: Array.from(event.target.selectedOptions).map(
                          (option) => option.value,
                        ),
                      })
                    }
                    className="scrollbar-thin h-28 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Tax rules"
            description="Which category applies in which state."
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    rules: [
                      ...current.rules,
                      {
                        id: `txr-${Date.now().toString(36)}`,
                        name: "New rule",
                        country: current.country,
                        countryCode: current.countryCode,
                        state: current.state,
                        categoryId: current.taxCategories[0]?.id ?? "",
                        priority: 1,
                        active: true,
                      },
                    ],
                  }))
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Add rule
              </Button>
            }
          />
          <CardBody className="p-0">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead align="right">Priority</TableHead>
                    <TableHead>Active</TableHead>
                    <th scope="col" className="px-4 py-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.rules.map((rule) => (
                    <TableRow key={rule.id} interactive>
                      <TableCell>
                        <Input
                          value={rule.name}
                          aria-label={`Name for ${rule.name}`}
                          onChange={(event) => updateRule(rule.id, { name: event.target.value })}
                          className="h-8 max-w-48"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={rule.state}
                          aria-label={`State for ${rule.name}`}
                          onChange={(event) => updateRule(rule.id, { state: event.target.value })}
                          className="h-8 max-w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={rule.categoryId}
                          aria-label={`Category for ${rule.name}`}
                          onChange={(event) =>
                            updateRule(rule.id, { categoryId: event.target.value })
                          }
                          className="h-8 max-w-48"
                        >
                          {form.taxCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        <Input
                          type="number"
                          min={1}
                          value={rule.priority}
                          aria-label={`Priority for ${rule.name}`}
                          onChange={(event) =>
                            updateRule(rule.id, { priority: Number(event.target.value) })
                          }
                          className="h-8 w-16 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={`Active for ${rule.name}`}
                          checked={rule.active}
                          onChange={(event) =>
                            updateRule(rule.id, { active: event.target.checked })
                          }
                          className="size-4 rounded border-line-strong accent-brand-600"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          aria-label={`Remove ${rule.name}`}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              rules: current.rules.filter((item) => item.id !== rule.id),
                            }))
                          }
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Calculation preview" description="Worked example using the first category." />
          <CardBody>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Pre-tax amount" htmlFor="tax-preview-amount" className="w-48">
                <Input
                  id="tax-preview-amount"
                  type="number"
                  min={0}
                  value={previewAmount}
                  onChange={(event) => setPreviewAmount(Number(event.target.value))}
                />
              </Field>
              <div className="flex-1 rounded-lg border border-line bg-surface-2 p-3">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Net amount</dt>
                    <dd className="tabular-nums text-ink">{money(previewAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">
                      Tax at {primaryCategory?.rate ?? 0}%
                    </dt>
                    <dd className="tabular-nums text-ink">{money(previewTax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                    <dt className="text-ink">
                      {form.pricesIncludeTax ? "Price including tax" : "Total payable"}
                    </dt>
                    <dd className="tabular-nums text-ink">
                      {money(form.pricesIncludeTax ? previewAmount : previewAmount + previewTax)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardBody>
        </Card>

        <FormActions>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save tax settings
          </Button>
        </FormActions>
      </Page>
    </SettingsLayout>
  );
}

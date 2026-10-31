"use client";

import * as React from "react";
import { Search, Settings2, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { integrationService } from "@/lib/services/storefront";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import type { Integration } from "@/lib/types";

const CATEGORIES: { value: Integration["category"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "payments", label: "Payments" },
  { value: "shipping", label: "Shipping" },
  { value: "marketing", label: "Marketing" },
  { value: "analytics", label: "Analytics" },
  { value: "communication", label: "Communication" },
  { value: "support", label: "Support" },
];

export default function IntegrationsPage() {
  const integrations = useDataStore((state) => state.integrations);
  const toast = useUIStore((state) => state.toast);

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Integration["category"] | "all">("all");
  const [configuring, setConfiguring] = React.useState<Integration | null>(null);
  const [config, setConfig] = React.useState<Integration["config"]>([]);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return integrations.filter((integration) => {
      if (category !== "all" && integration.category !== category) return false;
      if (term && !`${integration.name} ${integration.description}`.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [integrations, query, category]);

  const connected = integrations.filter((integration) => integration.status === "connected").length;

  const toggle = async (integration: Integration) => {
    setBusy(true);
    try {
      if (integration.status === "connected") {
        await integrationService.disable(integration.id);
        toast({ variant: "info", title: `${integration.name} disabled` });
      } else {
        await integrationService.connect(integration.id);
        toast({
          variant: "success",
          title: `${integration.name} connected (demo)`,
          description: "No real account was linked — the demo only records the state.",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not update the integration",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Integrations"
        description="A marketplace of demo integrations. Nothing here talks to a real provider."
        actions={
          <Badge tone="info">
            {connected} of {integrations.length} connected
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search integrations…"
          className="sm:w-72"
        />
        <FilterBar className="gap-1.5">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                category === item.value
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
                  : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </FilterBar>
      </div>

      <CardGrid columns={3}>
        {filtered.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
                  {integration.name.toLowerCase().includes("whatsapp") ? (
                    <WhatsappIcon className="size-5" style={{ color: WHATSAPP_GREEN }} />
                  ) : (
                    integration.logoText
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{integration.name}</h3>
                    <Badge
                      tone={
                        integration.status === "connected"
                          ? "success"
                          : integration.status === "disabled"
                            ? "neutral"
                            : "info"
                      }
                      dot
                    >
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium capitalize text-ink-subtle">
                    {integration.category}
                  </p>
                </div>
              </div>

              <p className="mt-3 flex-1 text-sm leading-6 text-ink-muted">
                {integration.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConfiguring(integration);
                    setConfig(integration.config);
                  }}
                >
                  <Settings2 className="size-3.5" aria-hidden />
                  Configure
                </Button>
                <Button
                  variant={integration.status === "connected" ? "ghost" : "primary"}
                  size="sm"
                  loading={busy}
                  onClick={() => void toggle(integration)}
                >
                  {integration.status === "connected" ? (
                    <>
                      <ToggleRight className="size-3.5" aria-hidden />
                      Disable
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="size-3.5" aria-hidden />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </CardGrid>

      {!filtered.length ? (
        <Card>
          <CardBody>
            <p className="py-10 text-center text-sm text-ink-muted">
              <Search className="mx-auto mb-2 size-5" aria-hidden />
              No integrations match that search.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Demo integrations only
        </p>
        <p className="mt-1 leading-5">
          Enabling an integration flips local state and stores placeholder configuration. No API
          keys are validated, no data is sent, and no third-party account is linked.
        </p>
      </div>

      <Dialog
        open={Boolean(configuring)}
        onClose={() => setConfiguring(null)}
        title={configuring ? `Configure ${configuring.name}` : "Configure integration"}
        description="Values are stored locally. Leave the placeholders as they are."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfiguring(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={async () => {
                if (!configuring) return;
                setBusy(true);
                try {
                  await integrationService.updateConfig(configuring.id, config);
                  toast({ variant: "success", title: "Configuration saved" });
                  setConfiguring(null);
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not save",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save configuration
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {config.map((item, index) => (
            <Field key={item.key} label={item.label} htmlFor={`config-${item.key}`}>
              {item.type === "toggle" ? (
                <Switch
                  id={`config-${item.key}`}
                  checked={item.value === "true"}
                  onCheckedChange={(checked) =>
                    setConfig((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, value: String(checked) } : entry,
                      ),
                    )
                  }
                />
              ) : item.type === "select" ? (
                <Select
                  id={`config-${item.key}`}
                  value={item.value}
                  onChange={(event) =>
                    setConfig((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, value: event.target.value } : entry,
                      ),
                    )
                  }
                >
                  <option>Demo / simulated</option>
                  <option>Sandbox</option>
                  <option>Disabled</option>
                </Select>
              ) : (
                <Input
                  id={`config-${item.key}`}
                  value={item.value}
                  onChange={(event) =>
                    setConfig((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, value: event.target.value } : entry,
                      ),
                    )
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </Dialog>
    </Page>
  );
}

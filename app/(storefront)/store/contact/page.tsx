"use client";

import * as React from "react";
import { CheckCircle2, Info, Mail, MapPin, Phone } from "lucide-react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";
import { StoreContainer, StorePageTitle } from "@/components/storefront/store-container";

export default function ContactPage() {
  const settings = useStoreSettings();
  const pages = useDataStore((state) => state.pages);
  const about = pages.find((page) => page.slug === "about");

  const [form, setForm] = React.useState({ name: "", email: "", message: "" });
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <StoreContainer width="5xl" padding="lg">
      <StorePageTitle
        title="Contact us"
        description="We reply to every message within one working day."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" aria-hidden />
                </span>
                <p className="mt-3 text-md font-semibold text-ink">Message captured</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-ink-muted">
                  This demo does not send email. Your message was stored in the browser only.
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!form.name.trim() || !form.email.includes("@") || !form.message.trim()) {
                    setError("Please fill in your name, a valid email and a message.");
                    return;
                  }
                  setError(null);
                  setSent(true);
                }}
              >
                <Field label="Your name" required htmlFor="contact-name">
                  <Input
                    id="contact-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </Field>
                <Field label="Email address" required htmlFor="contact-email">
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </Field>
                <Field label="Message" required htmlFor="contact-message">
                  <Textarea
                    id="contact-message"
                    rows={5}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    placeholder="How can we help?"
                  />
                </Field>
                {error ? (
                  <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" variant="primary" className="self-start">
                  <Mail className="size-4" aria-hidden />
                  Send message
                </Button>
              </form>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardBody className="flex flex-col gap-3 text-sm text-ink-muted">
              <p className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                {settings.general.email}
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                {settings.general.phone}
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                <span>
                  {settings.general.addressLine1}
                  {settings.general.addressLine2 ? `, ${settings.general.addressLine2}` : ""}
                  <br />
                  {settings.general.city}, {settings.general.state}{" "}
                  {settings.general.postalCode}
                  <br />
                  {settings.general.country}
                </span>
              </p>
            </CardBody>
          </Card>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="flex items-center gap-2 font-medium">
              <Info className="size-4 shrink-0" aria-hidden />
              Demo contact form
            </p>
            <p className="mt-1">No email is delivered from this form.</p>
          </div>
          {about ? (
            <Card>
              <CardBody>
                <h2 className="text-base font-semibold text-ink">About {settings.general.storeName}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {about.content.split("\n\n")[0]}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </StoreContainer>
  );
}

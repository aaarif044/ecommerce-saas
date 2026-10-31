import { Suspense, type ReactNode } from "react";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { WhatsappFloatingButton } from "@/components/storefront/whatsapp-share";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Suspense fallback={<div className="h-16 border-b border-line bg-surface" aria-hidden />}>
        <StoreHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <WhatsappFloatingButton />
    </div>
  );
}

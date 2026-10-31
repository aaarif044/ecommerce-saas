'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useDataStore, useStoreSettings } from '@/lib/store/data-store';
import { calculateTotals, defaultShippingMethod, shippingQuoteFor, taxRateResolver } from '@/lib/services/checkout';
import { useMoney } from '@/lib/hooks';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { ProductImage } from '@/components/product-image';
import { WhatsappCheckoutButton } from '@/components/storefront/whatsapp-checkout-button';
import { QuantityStepper } from '@/components/storefront/quantity-stepper';
import { StoreLinkButton } from '@/components/storefront/store-container';

export function CartDrawer({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const settings = useStoreSettings();
  const zones = useDataStore((state) => state.shippingZones);
  const money = useMoney();

  const totals = calculateTotals(items, {
    shipping: shippingQuoteFor(defaultShippingMethod(zones, settings.shipping), settings.shipping.freeShippingThreshold),
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    taxRateFor: taxRateResolver(settings.taxes),
  });

  return (
    <>
      <button type='button' onClick={() => setOpen(true)} aria-label='Open cart' className='inline-flex items-center'>
        {trigger}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title='Your cart'
        description={items.length ? `${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}` : undefined}
        footer={
          items.length ? (
            <>
              <div className='mr-auto'>
                <p className='text-xs text-ink-muted'>Subtotal</p>
                <p className='text-md font-semibold tabular-nums text-ink'>{money(totals.subtotal)}</p>
              </div>
              <Button variant='secondary' onClick={() => setOpen(false)}>
                Continue shopping
              </Button>
              {settings.checkout.whatsapp.enabled ? (
                <WhatsappCheckoutButton totals={totals} label='Checkout on WhatsApp' className='h-9 w-auto px-2 text-sm' />
              ) : (
                <StoreLinkButton href='/store/checkout' onClick={() => setOpen(false)}>
                  Checkout
                </StoreLinkButton>
              )}
            </>
          ) : null
        }
      >
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={<ShoppingBag className='size-5' aria-hidden />}
            title='Your cart is empty'
            description='Add a few things you like and they will show up here.'
            action={
              <StoreLinkButton href='/store/products' onClick={() => setOpen(false)}>
                Browse products
              </StoreLinkButton>
            }
          />
        ) : (
          <ul className='flex flex-col gap-3'>
            {items.map((item) => (
              <li key={item.id} className='flex gap-3 rounded-xl border border-line p-3'>
                <ProductImage assetId={item.assetId} alt={item.title} className='size-16 shrink-0' />
                <div className='flex min-w-0 flex-1 flex-col'>
                  <Link
                    href={`/store/products/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className='truncate text-sm font-medium text-ink hover:underline'
                  >
                    {item.title}
                  </Link>
                  <p className='truncate text-2xs text-ink-subtle'>
                    {item.variantTitle} · {item.sku}
                  </p>
                  <div className='mt-auto flex items-center gap-2 pt-2'>
                    <QuantityStepper size='sm' value={item.quantity} max={item.maxQuantity} onChange={(value) => updateQuantity(item.id, value)} />
                    <span className='text-sm font-semibold tabular-nums text-ink'>{money(item.unitPrice * item.quantity)}</span>
                    <Button
                      variant='ghost'
                      size='iconSm'
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.title} from cart`}
                      className='ml-auto text-ink-subtle hover:text-red-600 dark:hover:text-red-600'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}

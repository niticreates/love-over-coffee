import type { Metadata } from "next";
import Link from "next/link";
import { Checkout } from "@/components/checkout/Checkout";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { settings } = await getSiteData();
  const c = settings.commerce;
  const taxNote = c.tax_bps == null ? "Taxes" : `GST ${(c.tax_bps / 100).toFixed(c.tax_bps % 100 ? 1 : 0)}%${c.tax_inclusive ? " (included)" : ""}`;
  return (
    <div className="container-site pt-28 pb-section md:pt-36">
      <p className="eyebrow text-terracotta-ink">Checkout</p>
      <h1 className="mt-4 text-display-md">Almost there.</h1>
      <div className="mt-12">
        {c.ordering_enabled ? (
          <Checkout deliveryEnabled={c.delivery_enabled} taxNote={taxNote} phone={settings.business.phone_display} />
        ) : (
          <div className="max-w-xl">
            <p className="text-lg">Online ordering isn&apos;t open yet. Please call <a className="link-underline" href={`tel:${settings.business.phone_e164}`}>{settings.business.phone_display}</a> to order.</p>
            <Link href="/menu" className="btn btn-outline mt-8">Back to menu</Link>
          </div>
        )}
      </div>
    </div>
  );
}

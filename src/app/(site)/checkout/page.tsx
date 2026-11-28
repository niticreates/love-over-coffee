import type { Metadata } from "next";
import Link from "next/link";
import { Checkout } from "@/components/checkout/Checkout";
import { PageHero } from "@/components/ui/PageHero";
import { getSiteData } from "@/lib/site";
import { DemoFormNotice } from "@/components/layout/DemoNotice";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { DEMO_PAYMENT_NOTE } from "@/lib/demo-copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { settings, flags } = await getSiteData();
  const c = settings.commerce;
  const taxNote = c.tax_bps == null ? "Taxes" : `GST ${(c.tax_bps / 100).toFixed(c.tax_bps % 100 ? 1 : 0)}%${c.tax_inclusive ? " (included)" : ""}`;
  return (
    <>
    <PageHero size="compact" eyebrow="Checkout" title={<>Almost <em className="text-turquoise-deep">there</em><span className="text-pink">.</span></>} intro={<p>{flags.demo ? `Pickup from the café on Scheme 113. ${DEMO_PAYMENT_NOTE}` : "Pickup from the café on Scheme 113. Nothing is charged until you confirm payment."}</p>} />
    <div className="bg-cream py-14 md:py-20">
    <div className="container-site pb-section">
      <div>
        {c.ordering_enabled ? (
          <>
            <DemoFormNotice className="mb-6" />
            <Checkout deliveryEnabled={c.delivery_enabled} taxNote={taxNote} phone={settings.business.phone_display} demo={flags.demo} />
          </>
        ) : (
          <div className="max-w-xl">
            <p className="text-lg">Online ordering isn&apos;t open yet. {settings.business.phone_e164 ? <>Please call <PhoneLink e164={settings.business.phone_e164} className="link-underline">{settings.business.phone_display}</PhoneLink> to order.</> : <PhoneLink e164={null}>{null}</PhoneLink>}</p>
            <Link href="/menu" className="btn btn-outline mt-8">Back to menu</Link>
          </div>
        )}
      </div>
    </div>
    </div>
    </>
  );
}

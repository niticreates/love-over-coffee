import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Nav } from "@/components/layout/Nav";
import { getSiteData } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getSiteData();
  return (
    <>
      <Nav phone={settings.business.phone_e164} announcement={settings.content.announcement} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <MobileActionBar phone={settings.business.phone_e164} />
      <CartDrawer orderingEnabled={settings.commerce.ordering_enabled} />
    </>
  );
}

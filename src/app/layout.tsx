import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Quicksand } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { JsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-fraunces", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const brand = Quicksand({ subsets: ["latin"], weight: ["700"], variable: "--font-quicksand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Love Over Coffee — Café in Vijay Nagar, Indore", template: "%s · Love Over Coffee, Vijay Nagar" },
  description: "Coffee, frappes, comfort food and board games at Love Over Coffee, Scheme 113, Vijay Nagar, Indore. Order online for pickup or reserve a table.",
  applicationName: "Love Over Coffee",
  formatDetection: { telephone: true },
  openGraph: {
    siteName: "Love Over Coffee — Vijay Nagar",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/exterior/storefront-signage.webp", width: 765, height: 1020, alt: "The Love Over Coffee storefront in Vijay Nagar, Indore" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FBF7EF", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteData();
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} ${brand.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
        <JsonLd data={localBusinessJsonLd(settings)} />
      </body>
    </html>
  );
}

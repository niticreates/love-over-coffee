import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Quicksand } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { JsonLd, localBusinessJsonLd, OG_IMAGE, SITE_URL, websiteJsonLd } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-fraunces", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const brand = Quicksand({ subsets: ["latin"], weight: ["700"], variable: "--font-quicksand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Love Over Coffee Indore | Café in Vijay Nagar, Scheme 113", template: "%s | Love Over Coffee Indore" },
  description: "Love Over Coffee is a cosy café in Vijay Nagar (Scheme 113), Indore for cold coffee, frappes, nachos, pasta and desserts. Reserve a table or order online.",
  keywords: ["love over coffee indore", "love over coffee vijay nagar", "cafe in vijay nagar indore", "cafe in indore", "vijay nagar restaurants", "best coffee in indore", "cold coffee indore", "birthday celebration cafe in indore", "cafe for couples in indore", "aesthetic cafe in indore"],
  category: "Café",
  applicationName: "Love Over Coffee",
  formatDetection: { telephone: true },
  openGraph: {
    siteName: "Love Over Coffee — Vijay Nagar",
    locale: "en_IN",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FBF7EF", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, platforms } = await getSiteData();
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} ${brand.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
        <JsonLd data={localBusinessJsonLd(settings, platforms)} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}

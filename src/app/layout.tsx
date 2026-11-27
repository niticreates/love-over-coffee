import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { JsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Love Over Coffee — Café in Vijay Nagar, Indore", template: "%s · Love Over Coffee, Vijay Nagar" },
  description: "Coffee, frappes, comfort food and board games at Love Over Coffee, Scheme 113, Vijay Nagar, Indore. Order online for pickup or reserve a table.",
  applicationName: "Love Over Coffee",
  formatDetection: { telephone: true },
  openGraph: { siteName: "Love Over Coffee — Vijay Nagar", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#F2EBDD", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteData();
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
        <JsonLd data={localBusinessJsonLd(settings)} />
      </body>
    </html>
  );
}

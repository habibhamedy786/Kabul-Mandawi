import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LocaleShell } from "@/components/LocaleShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://kabulmandawi.com"),
  title: "Kabul Mandawi | Online Shopping in Afghanistan",
  description:
    "Shop groceries, flowers, electronics, gifts and everyday essentials online — with free delivery across Kabul and same-day express when you need it fast.",
  openGraph: {
    title: "Kabul Mandawi | Online Shopping in Afghanistan",
    description:
      "Shop groceries, flowers, electronics, gifts and everyday essentials online — with free delivery across Kabul.",
    url: "https://kabulmandawi.com",
    siteName: "Kabul Mandawi",
    images: [{ url: "/logo.png" }],
    type: "website",
  },
};

// Organization data so Google can associate the Kabul Mandawi logo with the site.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kabul Mandawi",
  url: "https://kabulmandawi.com",
  logo: "https://kabulmandawi.com/logo.png",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <LocaleShell>{children}</LocaleShell>
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

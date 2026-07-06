import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { LocaleShell } from "@/components/LocaleShell";

export const metadata: Metadata = {
  title: "Kabul Mandawi | Online Shopping in Afghanistan",
  description:
    "Shop groceries, flowers, electronics, gifts and everyday essentials online — with free delivery across Kabul and same-day express when you need it fast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <LocaleShell>{children}</LocaleShell>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

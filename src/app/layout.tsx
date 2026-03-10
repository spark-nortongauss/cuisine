import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getServerDirection, getServerLocale } from "@/lib/i18n/server";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gastronomic Cuisine",
  description: "Premium AI menu operations for chefs",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  const direction = getServerDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <I18nProvider locale={locale}>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}

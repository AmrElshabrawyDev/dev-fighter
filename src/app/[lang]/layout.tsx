import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { dir, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getDictionary();
  const locale = await getLocale();
  return {
    title: { default: meta.title, template: `%s · Dev Fighter` },
    description: meta.description,
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { title: meta.title, description: meta.description, locale: locale === "ar" ? "ar_AR" : "en_US", type: "website" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)} className="h-full">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

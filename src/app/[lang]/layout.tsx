import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { dir, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getDictionary();
  const locale = await getLocale();
  return {
    // the home page's metadata; every other page sets its own (see lib/seo)
    ...pageMetadata({ locale, path: "", description: meta.description, siteTitle: meta.title }),
    metadataBase: siteUrl,
    title: { default: meta.title, template: `%s · Dev Fighter` },
    applicationName: "Dev Fighter",
    authors: [{ name: "Amr Elshabrawy", url: "https://amrelshabrawydev.github.io" }],
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

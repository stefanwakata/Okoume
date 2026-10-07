import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";
import { Flash } from "@/components/Flash";
import { getViewer, isMember } from "@/server/dal/session";
import { isDemo, appUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Okoumé, les manuels de l’asso", template: "%s · Okoumé" },
  description: "Les manuels des étudiants gabonais de Montréal, sur une seule étagère. Vends ou prête tes livres à quelqu’un de l’asso.",
  openGraph: { title: "Okoumé", description: "Les manuels des étudiants gabonais de Montréal, sur une seule étagère.", locale: "fr_CA", type: "website" },
  robots: isDemo ? { index: false, follow: false } : undefined,
};
export const viewport: Viewport = { themeColor: "#132029", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <html lang="fr-CA">
      <body className={isDemo ? "demo" : undefined}>
        <a className="skip" href="#main">Aller au contenu</a>
        {isDemo && <div className="demo-bar">Version de démo, annonces fictives. <Link href="/demo/courriels">Courriels envoyés</Link></div>}
        <Header signedIn={!!viewer} isAdmin={viewer?.role === "admin"} canPublish={isMember(viewer)} />
        <main id="main" tabIndex={-1}>{children}</main>
        <footer>
          <span>Okoumé, un projet pour l’association des étudiants gabonais à Montréal.</span>
          <span className="flinks"><Link href="/confidentialite">Confidentialité</Link><Link href="/conditions">Conditions d’utilisation</Link></span>
        </footer>
        <Flash />
      </body>
    </html>
  );
}

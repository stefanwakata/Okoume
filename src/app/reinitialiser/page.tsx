import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Choisir un nouveau mot de passe", referrer: "no-referrer" };

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" && /^[A-Za-z0-9_-]{8,200}$/.test(sp.token) ? sp.token : null;
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Nouveau mot de passe</h1>
      {!token || sp.error ? (
        <div className="note-box warn" style={{ marginTop: 24 }}>
          <p>Ce lien a expiré ou a déjà servi. <Link className="inline" href="/mot-de-passe-oublie">Demande un nouveau lien</Link>.</p>
        </div>
      ) : (
        <div className="paper top" style={{ marginTop: 32 }}>
          <div className="head"><span>Nouveau mot de passe</span><span>Okoumé</span></div>
          <ResetForm token={token} />
        </div>
      )}
    </div></div>
  );
}

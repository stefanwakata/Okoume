import type { Metadata } from "next";
import Link from "next/link";
import { ResendVerification } from "@/components/auth/forms";
import { isDemo } from "@/lib/env";

export const metadata: Metadata = { title: "Confirme ton courriel" };

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ courriel?: string; nouveau?: string; error?: string }> }) {
  const sp = await searchParams;
  const email = typeof sp.courriel === "string" ? sp.courriel.slice(0, 254) : undefined;
  return (
    <div className="page"><div className="wrap narrow">
      <h1>{sp.error ? "Ce lien ne marche plus" : "Regarde tes courriels"}</h1>
      {sp.error ? (
        <p className="lede">Le lien de confirmation a expiré ou a déjà servi. Demande-en un nouveau ci-dessous.</p>
      ) : (
        <p className="lede">
          {sp.nouveau ? "Ton compte est créé. " : ""}On a envoyé un lien de confirmation{email ? <> à <b>{email}</b></> : null}. Il est valide 24 heures. Pense à regarder dans les indésirables.
        </p>
      )}
      {isDemo && (
        <div className="note-box" style={{ marginTop: 24 }}>
          <p>Version de démonstration : aucun courriel ne part vraiment. Ouvre la <Link className="inline" href="/demo/courriels">boîte de démo</Link> pour cliquer sur le lien.</p>
        </div>
      )}
      <div className="paper top" style={{ marginTop: 32 }}>
        <div className="head"><span>Pas reçu ?</span><span>Okoumé</span></div>
        <ResendVerification email={email} />
      </div>
      {!isDemo && <p className="muted" style={{ marginTop: 24 }}>Après la confirmation, quelqu’un du comité de l’asso valide ton compte, en général dans la journée. Tu reçois un courriel à ce moment-là.</p>}
    </div></div>
  );
}

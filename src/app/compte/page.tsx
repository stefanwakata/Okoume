import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/dal/session";
import { accountSummary } from "@/server/dal/account";
import { myListings } from "@/server/dal/listings";
import { priceLabel, statusLabel, fmtDate } from "@/lib/present";
import { SignOutButtons, ChangePasswordForm, DeleteAccountForm } from "@/components/AccountActions";
import { Btn } from "@/components/Btn";

export const metadata: Metadata = { title: "Mon compte" };

const STATUS_TEXT = {
  pending: "En attente de validation par le comité de l’asso. Tu peux parcourir les annonces ; tu pourras publier et réserver une fois validé.",
  approved: "Membre validé. Tu peux publier et réserver.",
  suspended: "Compte suspendu. Écris au comité de l’asso si c’est une erreur.",
} as const;

export default async function Account() {
  if (!(await getViewer())) redirect("/connexion?next=/compte");
  const [me, listings] = await Promise.all([accountSummary(), myListings()]);
  return (
    <div className="page"><div className="wrap">
      <h1>Mon compte</h1>
      <p className="lede">{me.name}, {me.email}{me.school ? `, ${me.school}` : ""}.</p>

      <div className={`note-box${me.memberStatus === "approved" || me.role === "admin" ? "" : " warn"}`} style={{ marginTop: 24, maxWidth: 720 }}>
        <p>{me.role === "admin" ? "Compte du comité. Tu valides les membres dans l’onglet Comité." : STATUS_TEXT[me.memberStatus]}</p>
      </div>

      <section style={{ marginTop: 56 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
          <h2>Mes annonces</h2>
          <Link className="inline" href="/compte/reservations">Voir mes réservations</Link>
        </div>
        {listings.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}>
            <p>Tu n’as encore rien mis sur l’étagère.</p>
            {(me.memberStatus === "approved" || me.role === "admin") && <p style={{ marginTop: 16 }}><Btn href="/publier">Publier un livre</Btn></p>}
          </div>
        ) : (
          <div className="rows" style={{ marginTop: 20 }}>
            {listings.map((l) => (
              <Link key={l.id} href={`/annonces/${l.id}`} className="lrow" style={{ ["--c" as string]: l.spineColor }}>
                <i />
                <span><b>{l.courseCode}</b> {l.title}<span className="meta">{l.edition}, publié le {fmtDate(l.createdAt)}</span></span>
                <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className={`status-tag${l.status === "available" ? "" : " on"}`}>{statusLabel[l.status]}</span>
                  <em>{priceLabel(l.kind, l.priceCents)}</em>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="account-grid" style={{ marginTop: 64 }}>
        <div className="stack" style={{ ["--s" as string]: "14px" }}>
          <h2>Session</h2>
          <p className="muted">Connecté sur cet appareil. Si tu as utilisé un ordinateur de la bibliothèque, déconnecte aussi les autres appareils.</p>
          <SignOutButtons />
        </div>
        <div className="paper top">
          <div className="head"><span>Mot de passe</span></div>
          <ChangePasswordForm />
        </div>
      </section>

      <section className="account-grid" style={{ marginTop: 64 }}>
        <div className="stack" style={{ ["--s" as string]: "14px" }}>
          <h2>Tes données</h2>
          <p className="muted">Tout ce qu’Okoumé garde sur toi, dans un fichier que tu peux ouvrir ou réutiliser.</p>
          <p><a className="btn sm ghost" href="/compte/export" download><span className="r">Télécharger mes données</span><span className="r" aria-hidden="true">Télécharger mes données</span></a></p>
          <p className="muted" style={{ fontSize: 15 }}>Membre depuis le {me.createdAt ? fmtDate(me.createdAt) : "début"}. Détails dans la <Link className="inline" href="/confidentialite">politique de confidentialité</Link>.</p>
        </div>
        {me.role !== "admin" && (
          <details className="paper side danger">
            <summary>Supprimer mon compte</summary>
            <div style={{ marginTop: 18 }}><DeleteAccountForm /></div>
          </details>
        )}
      </section>
    </div></div>
  );
}

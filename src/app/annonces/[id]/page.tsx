import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getListing } from "@/server/dal/listings";
import { getViewer, isMember } from "@/server/dal/session";
import { myActiveReservationFor } from "@/server/dal/reservations";
import { AppError } from "@/server/errors";
import { priceLabel, statusLabel, sectionName, reservationLabel } from "@/lib/present";
import { ReserveForm } from "@/components/ReserveForm";
import { ActionButton } from "@/components/ActionButton";
import { withdrawListingAction } from "@/server/actions/listings";
import { removeListingAction } from "@/server/actions/admin";
import { cancelAction } from "@/server/actions/reservations";

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  try { return await getListing(id); } catch (e) { if (e instanceof AppError && e.code === "not_found") notFound(); throw e; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = await load(id);
  return { title: `${l.courseCode} ${l.title}`, description: `${l.title}, ${l.edition}, ${priceLabel(l.kind, l.priceCents)}. Annonce de l’étagère Okoumé.` };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [l, viewer] = await Promise.all([load(id), getViewer()]);
  const mine = viewer && !l.isOwner ? await myActiveReservationFor(l.id, viewer.id) : null;
  const member = isMember(viewer);
  return (
    <div className="page"><div className="wrap">
      <p><Link className="inline" href="/annonces">Toutes les annonces</Link></p>
      <div className="detail">
        <div className="paper top libcard">
          <div className="head"><span><b>{l.courseCode}</b>&ensp;{sectionName(l.section)}</span><span>{statusLabel[l.status]}</span></div>
          <h1 style={{ fontSize: "clamp(30px,3.6vw,44px)", color: "var(--paper-ink)" }}>{l.title}</h1>
          <dl>
            <dt>Édition</dt><dd>{l.edition}</dd>
            <dt>Établissement</dt><dd>{l.school}</dd>
            <dt>État</dt><dd>{l.condition}</dd>
            <dt>Personne</dt><dd>{l.sellerFirstName ?? <span className="muted">visible pour les membres</span>}</dd>
            <dt>Où</dt><dd>{l.meetingPlace ?? <span className="muted">visible pour les membres</span>}</dd>
          </dl>
          <div className="price">{l.kind === "loan" ? "Prêt pour la session" : priceLabel(l.kind, l.priceCents)}</div>
        </div>

        <aside className="stack" style={{ ["--s" as string]: "18px" }}>
          <div className="spine-preview" style={{ ["--c" as string]: l.spineColor }} aria-hidden="true"><span>{l.courseCode}</span><span className="t">{l.title}</span><span>{priceLabel(l.kind, l.priceCents)}</span></div>

          {l.isOwner ? (
            <div className="stack">
              <p>C’est ton annonce.</p>
              {l.status === "available" ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn sm" href={`/annonces/${l.id}/modifier`}><span className="r">Modifier</span><span className="r" aria-hidden="true">Modifier</span></Link>
                  <ActionButton action={withdrawListingAction} fields={{ id: l.id }} label="Retirer de l’étagère" variant="ghost" confirm="Retirer ce livre de l’étagère ?" />
                </div>
              ) : <p className="lede">Elle est {statusLabel[l.status].toLowerCase()}. Suis la réservation dans <Link className="inline" href="/compte/reservations">Réservations</Link>.</p>}
            </div>
          ) : !viewer ? (
            <div className="note-box"><p>Pour réserver ce livre, <Link className="inline" href={`/connexion?next=/annonces/${l.id}`}>connecte-toi</Link> ou <Link className="inline" href="/inscription">crée un compte</Link>.</p></div>
          ) : !member ? (
            <div className="note-box warn"><p>Ton compte attend la validation du comité. Tu pourras réserver dès qu’il sera validé.</p></div>
          ) : mine ? (
            <div className="stack">
              <p>Ta demande : <b>{reservationLabel[mine.status].toLowerCase()}</b>.</p>
              {mine.status === "requested" && <ActionButton action={cancelAction} fields={{ id: mine.id }} label="Annuler ma demande" variant="ghost" />}
            </div>
          ) : l.status === "available" ? (
            <ReserveForm listingId={l.id} kind={l.kind} />
          ) : (
            <div className="note-box"><p>Ce livre est {statusLabel[l.status].toLowerCase()}. Il reviendra sur l’étagère si la réservation est annulée.</p></div>
          )}

          {viewer?.role === "admin" && !l.isOwner && (
            <details className="note-box warn">
              <summary style={{ fontSize: 17, padding: "4px 0" }}>Comité : retirer l’annonce</summary>
              <ActionButton action={removeListingAction} fields={{ id: l.id }} label="Retirer l’annonce" variant="ghost">
                <label style={{ display: "grid", gap: 4, fontSize: 15 }}>Raison (gardée dans le journal)
                  <input name="reason" required minLength={3} maxLength={200} style={{ font: "inherit", padding: 8 }} />
                </label>
              </ActionButton>
            </details>
          )}
        </aside>
      </div>
    </div></div>
  );
}

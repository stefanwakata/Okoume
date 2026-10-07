import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/dal/session";
import { incomingRequests, myRequests } from "@/server/dal/reservations";
import { priceLabel, reservationLabel, fmtDate } from "@/lib/present";
import { ActionButton } from "@/components/ActionButton";
import { HandOverForm } from "@/components/HandOverForm";
import { acceptAction, declineAction, cancelAction, returnedAction } from "@/server/actions/reservations";

export const metadata: Metadata = { title: "Réservations" };

const ACTIVE = new Set(["requested", "accepted", "handed"]);

/** End of the current term (Quebec calendar): 20 Dec, 30 Apr or 20 Aug. */
function endOfTerm(now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const d = m >= 9 ? `${y}-12-20` : m <= 4 ? `${y}-04-30` : `${y}-08-20`;
  return new Date(d) > now ? d : `${y + 1}-04-30`;
}

export default async function Reservations() {
  if (!(await getViewer())) redirect("/connexion?next=/compte/reservations");
  const [incoming, outgoing] = await Promise.all([incomingRequests(), myRequests()]);
  const due = endOfTerm();
  const inActive = incoming.filter((r) => ACTIVE.has(r.status));
  const inPast = incoming.filter((r) => !ACTIVE.has(r.status));
  const outActive = outgoing.filter((r) => ACTIVE.has(r.status));
  const outPast = outgoing.filter((r) => !ACTIVE.has(r.status));

  return (
    <div className="page"><div className="wrap">
      <h1>Réservations</h1>
      <p className="lede">Les demandes sur tes livres, et celles que tu as faites. Le rendez-vous se fixe par courriel une fois la demande acceptée.</p>

      <section style={{ marginTop: 48 }}>
        <h2>Sur tes livres</h2>
        {inActive.length === 0 ? <p className="muted" style={{ marginTop: 14 }}>Aucune demande en cours.</p> : (
          <ul className="res-list">
            {inActive.map((r) => (
              <li key={r.id} className="res">
                <div>
                  <p className="res-t"><Link href={`/annonces/${r.listingId}`}><b>{r.courseCode}</b> {r.title}</Link></p>
                  <p className="muted">{r.buyerName.split(" ")[0]}, demandé le {fmtDate(r.createdAt)}, {r.kind === "loan" ? "prêt pour la session" : priceLabel(r.kind, r.priceCents)}</p>
                  {r.message && <blockquote>{r.message}</blockquote>}
                  {r.status !== "requested" && <p>Contact : <a className="inline" href={`mailto:${r.buyerEmail}`}>{r.buyerEmail}</a>{r.dueDate ? <>, retour prévu le {fmtDate(r.dueDate)}</> : null}</p>}
                </div>
                <div className="res-side">
                  <span className="status-tag on">{reservationLabel[r.status]}</span>
                  <div className="acts">
                    {r.status === "requested" && <>
                      <ActionButton action={acceptAction} fields={{ id: r.id }} label="Accepter" />
                      <ActionButton action={declineAction} fields={{ id: r.id }} label="Refuser" variant="ghost" />
                    </>}
                    {r.status === "accepted" && <HandOverForm id={r.id} kind={r.kind} defaultDue={due} />}
                    {r.status === "handed" && <ActionButton action={returnedAction} fields={{ id: r.id }} label="Livre rendu" />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 56 }}>
        <h2>Tes demandes</h2>
        {outActive.length === 0 ? (
          <p className="muted" style={{ marginTop: 14 }}>Aucune demande en cours. <Link className="inline" href="/annonces">Parcourir les annonces</Link></p>
        ) : (
          <ul className="res-list">
            {outActive.map((r) => (
              <li key={r.id} className="res">
                <div>
                  <p className="res-t"><Link href={`/annonces/${r.listingId}`}><b>{r.courseCode}</b> {r.title}</Link></p>
                  <p className="muted">Chez {r.sellerName.split(" ")[0]}, demandé le {fmtDate(r.createdAt)}, {r.kind === "loan" ? "prêt pour la session" : priceLabel(r.kind, r.priceCents)}</p>
                  {r.status === "requested" && <p>On attend la réponse. Tu reçois un courriel dès qu’elle arrive.</p>}
                  {r.status === "accepted" && <p>Acceptée. Écris à <a className="inline" href={`mailto:${r.sellerEmail}`}>{r.sellerEmail}</a> pour fixer le rendez-vous{r.meetingPlace ? <>, proposé : {r.meetingPlace}</> : null}.</p>}
                  {r.status === "handed" && r.dueDate && <p>À rendre le <b>{fmtDate(r.dueDate)}</b>. On t’envoie un rappel trois jours avant.</p>}
                </div>
                <div className="res-side">
                  <span className="status-tag on">{reservationLabel[r.status]}</span>
                  {r.status === "requested" && <div className="acts"><ActionButton action={cancelAction} fields={{ id: r.id }} label="Annuler" variant="ghost" /></div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(inPast.length > 0 || outPast.length > 0) && (
        <details style={{ marginTop: 56 }} className="history">
          <summary>Historique ({inPast.length + outPast.length})</summary>
          <table className="tbl" style={{ marginTop: 16 }}>
            <thead><tr><th>Livre</th><th>Avec</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>
              {[...inPast.map((r) => ({ ...r, who: r.buyerName })), ...outPast.map((r) => ({ ...r, who: r.sellerName }))]
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((r) => (
                  <tr key={r.id}><td><b>{r.courseCode}</b> {r.title}</td><td>{r.who.split(" ")[0]}</td><td>{reservationLabel[r.status]}</td><td>{fmtDate(r.createdAt)}</td></tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </div></div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/server/dal/session";
import { adminCounts, listMembers, recentAudit } from "@/server/dal/admin";
import { setMemberStatusAction } from "@/server/actions/admin";
import { ActionButton } from "@/components/ActionButton";
import { fmtDate } from "@/lib/present";

export const metadata: Metadata = { title: "Comité" };

const ACTION_LABEL: Record<string, string> = {
  "member.approved": "a validé le compte de", "member.suspended": "a suspendu le compte de", "listing.removed": "a retiré l’annonce",
};

export default async function Admin({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const v = await getViewer();
  if (!v) redirect("/connexion?next=/admin");
  if (v.role !== "admin") notFound(); // don't reveal the page to members
  const { vue } = await searchParams;
  const tab = vue === "membres" ? "approved" : vue === "suspendus" ? "suspended" : "pending";
  const [counts, members, log] = await Promise.all([adminCounts(), listMembers(tab), recentAudit()]);
  const tabs = [["pending", "", "À valider"], ["approved", "membres", "Membres"], ["suspended", "suspendus", "Suspendus"]] as const;

  return (
    <div className="page"><div className="wrap">
      <h1>Comité</h1>
      <p className="lede">Valide les nouveaux comptes et garde l’étagère propre.</p>
      <div className="kpis">
        <div><b>{counts.pending}</b>à valider</div>
        <div><b>{counts.members}</b>membres</div>
        <div><b>{counts.listings}</b>livres en circulation</div>
      </div>

      <nav className="tabs" aria-label="Comptes" style={{ marginTop: 48 }}>
        {tabs.map(([id, q, label]) => (
          <a key={id} href={q ? `/admin?vue=${q}` : "/admin"} aria-current={tab === id ? "page" : undefined}>{label}</a>
        ))}
      </nav>

      {members.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>{tab === "pending" ? "Personne n’attend. Les nouveaux comptes apparaissent ici après la confirmation du courriel." : "Aucun compte."}</p>
      ) : (
        <div className="tbl-wrap"><table className="tbl" style={{ marginTop: 12 }}>
          <thead><tr><th>Nom</th><th>Courriel</th><th>Établissement</th><th>Inscrit le</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}{m.role === "admin" && <span className="status-tag" style={{ marginLeft: 8 }}>Comité</span>}</td>
                <td>{m.email}{!m.emailVerified && <span className="muted"> (non confirmé)</span>}</td>
                <td>{m.school ?? "—"}</td>
                <td>{fmtDate(m.createdAt)}</td>
                <td><div className="acts">
                  {m.role !== "admin" && m.id !== v.id && tab !== "approved" && m.emailVerified &&
                    <ActionButton action={setMemberStatusAction} fields={{ id: m.id, status: "approved" }} label={tab === "suspended" ? "Réactiver" : "Valider"} />}
                  {m.role !== "admin" && m.id !== v.id && tab !== "suspended" &&
                    <ActionButton action={setMemberStatusAction} fields={{ id: m.id, status: "suspended" }} label="Suspendre" variant="ghost" confirm={`Suspendre ${m.name} ? Ses annonces disponibles seront retirées et ses sessions fermées.`} />}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <section style={{ marginTop: 64 }}>
        <h2>Journal</h2>
        <p className="muted" style={{ marginTop: 8 }}>Les 50 dernières décisions du comité.</p>
        {log.length === 0 ? <p className="muted" style={{ marginTop: 14 }}>Rien pour l’instant.</p> : (
          <ul className="log">
            {log.map((e) => (
              <li key={e.id}>
                <time>{fmtDate(e.createdAt)}</time> <b>{e.actorName ?? "Compte supprimé"}</b> {ACTION_LABEL[e.action] ?? e.action}{" "}
                {e.targetType === "user" ? <b>{e.targetName ?? "un compte supprimé"}</b> : e.listingLabel ? <b>{e.listingLabel}</b> : null}
                {e.action === "listing.removed" && e.details && typeof e.details === "object" && "reason" in e.details ? <span> : {String((e.details as { reason: unknown }).reason)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div></div>
  );
}

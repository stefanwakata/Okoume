import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemo } from "@/lib/env";
import { demoOutbox } from "@/server/dal/outbox";
import { fmtDate } from "@/lib/present";

export const metadata: Metadata = { title: "Boîte de démo" };
export const dynamic = "force-dynamic";

// Turns the URLs in a plain-text email into links (text stays escaped by React).
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return <pre>{parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p}>{p}</a> : p))}</pre>;
}

export default async function DemoOutbox() {
  if (!isDemo) notFound();
  const mails = await demoOutbox();
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Boîte de démo</h1>
      <p className="lede">Dans cette version de démonstration, aucun courriel ne part. Ceux que l’app aurait envoyés arrivent ici, les plus récents en haut. Les liens marchent.</p>
      {mails.length === 0 ? <p className="muted" style={{ marginTop: 32 }}>Aucun courriel pour l’instant. Crée un compte pour en voir un arriver.</p> : (
        <div className="stack outbox" style={{ marginTop: 32, ["--s" as string]: "18px" }}>
          {mails.map((m) => (
            <article key={m.id} className="paper side">
              <div className="head"><span>À : {m.to}</span><span>{fmtDate(m.createdAt)}</span></div>
              <h2 style={{ fontSize: 22, color: "var(--paper-ink)" }}>{m.subject}</h2>
              <Linkified text={m.text} />
            </article>
          ))}
        </div>
      )}
    </div></div>
  );
}

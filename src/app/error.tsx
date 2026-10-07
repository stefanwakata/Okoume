"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const digest = error && typeof error === "object" && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Ça n’a pas marché</h1>
      <p className="lede">Un problème de notre côté a empêché d’afficher cette page. Ce que tu avais enregistré avant est conservé.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <button className="btn" type="button" onClick={() => retry()}><span className="r">Réessayer</span><span className="r" aria-hidden="true">Réessayer</span></button>
        <Link className="btn line" href="/"><span className="r">Retour à l’étagère</span><span className="r" aria-hidden="true">Retour à l’étagère</span></Link>
      </div>
      {digest && <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>Code à donner au comité si ça se répète : {digest}</p>}
    </div></div>
  );
}

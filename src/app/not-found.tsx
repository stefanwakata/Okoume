import Link from "next/link";
import { Btn } from "@/components/Btn";

export default function NotFound() {
  return (
    <div className="page"><div className="wrap narrow">
      <p className="muted" style={{ font: "700 15px/1 var(--cond)", letterSpacing: ".08em", textTransform: "uppercase" }}>Erreur 404</p>
      <h1 style={{ marginTop: 12 }}>Ce livre n’est pas sur l’étagère</h1>
      <p className="lede">L’annonce a peut-être été retirée, ou le lien est incomplet.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <Btn href="/annonces">Chercher un livre</Btn>
        <Btn href="/" variant="line">Retour à l’étagère</Btn>
      </div>
      <p style={{ marginTop: 24 }}><Link className="inline" href="/compte/reservations">Mes réservations</Link></p>
    </div></div>
  );
}

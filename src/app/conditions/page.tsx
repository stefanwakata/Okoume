import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalNotice } from "@/components/LegalNotice";
import { fmtDate } from "@/lib/present";

export const metadata: Metadata = { title: "Conditions d’utilisation" };

export default function Terms() {
  return (
    <div className="page"><div className="wrap">
      <h1>Conditions d’utilisation</h1>
      <p className="lede">Les règles de l’étagère, en court. Mis à jour le {fmtDate(SITE.updated)}.</p>
      <LegalNotice />
      <div className="prose" style={{ marginTop: 32 }}>
        <h2>À quoi sert Okoumé</h2>
        <p>À vendre ou prêter des livres de cours entre membres de {SITE.asso}. Okoumé met les gens en contact ; l’échange se fait en personne, entre vous. Il n’y a pas de paiement en ligne.</p>

        <h2>Ton compte</h2>
        <ul>
          <li>Un compte par personne, à ton vrai nom. Le comité valide chaque compte.</li>
          <li>Garde ton mot de passe pour toi. Si tu penses qu’il a fuité, change-le depuis <Link href="/compte">Mon compte</Link>.</li>
        </ul>

        <h2>Tes annonces</h2>
        <ul>
          <li>Seulement des livres et du matériel de cours que tu as vraiment, décrits honnêtement (édition, état).</li>
          <li>Prix maximum de 1 000 $. Un prêt est gratuit.</li>
          <li>20 annonces actives au plus, et 10 demandes de réservation par jour.</li>
          <li>Pas de photocopies de manuels ni de contenu qui enfreint le droit d’auteur.</li>
        </ul>

        <h2>Les échanges</h2>
        <ul>
          <li>Rencontrez-vous dans un lieu public du campus.</li>
          <li>Un livre prêté se rend à la date convenue, dans l’état où il a été prêté.</li>
          <li>L’asso n’est pas partie à l’échange et ne garantit pas l’état des livres. En cas de souci, écris au comité : il peut retirer une annonce ou suspendre un compte.</li>
        </ul>

        <h2>Ce que le comité peut faire</h2>
        <p>Retirer une annonce qui ne respecte pas ces règles, suspendre un compte en cas d’abus. Chaque décision est notée dans un journal.</p>

        <h2>Contact</h2>
        <p><a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></p>
      </div>
    </div></div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalNotice } from "@/components/LegalNotice";
import { fmtDate } from "@/lib/present";

export const metadata: Metadata = { title: "Confidentialité", description: "Ce qu’Okoumé garde sur toi, pourquoi, combien de temps, et comment l’effacer." };

export default function Privacy() {
  return (
    <div className="page"><div className="wrap">
      <h1>Confidentialité</h1>
      <p className="lede">Ce qu’Okoumé garde sur toi, pourquoi, et comment tout effacer. Mis à jour le {fmtDate(SITE.updated)}.</p>
      <LegalNotice />
      <div className="prose" style={{ marginTop: 32 }}>
        <h2>Qui s’en occupe</h2>
        <p>Okoumé est géré par {SITE.asso}. La personne responsable de la protection des renseignements personnels est {SITE.privacyOfficer}. Pour toute question ou demande : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>

        <h2>Ce qu’on garde</h2>
        <ul>
          <li><b>Ton compte</b> : prénom et nom, courriel, établissement, mot de passe (chiffré, jamais lisible, même par nous).</li>
          <li><b>Tes annonces</b> : le livre, son état, le prix ou le prêt, le lieu de rencontre proposé.</li>
          <li><b>Tes réservations</b> : le livre demandé, ton message, les dates.</li>
          <li><b>Ta session</b> : un témoin de connexion, l’adresse IP et le navigateur de chaque session, pour te garder connecté et repérer les accès suspects.</li>
          <li><b>Les courriels envoyés</b> : une copie, pour vérifier qu’ils sont bien partis.</li>
        </ul>
        <p>Pas de publicité, pas de mesure d’audience, pas de témoin de suivi. Le seul témoin est celui de la connexion, plus un témoin de 20 secondes qui affiche les messages de confirmation.</p>

        <h2>Qui voit quoi</h2>
        <p>Les visiteurs voient le livre, l’édition, l’état et le prix. Les membres validés voient en plus ton prénom et le lieu de rencontre. Ton courriel n’est donné qu’à la personne dont tu acceptes la demande, ou qui accepte la tienne, pour fixer le rendez-vous. Le comité de l’asso voit les comptes pour les valider.</p>

        <h2>Combien de temps</h2>
        <ul>
          <li>Compte jamais confirmé : effacé après 7 jours.</li>
          <li>Sessions : 7 jours, puis effacées.</li>
          <li>Copies des courriels : 90 jours.</li>
          <li>Journal des décisions du comité : 1 an.</li>
          <li>Compte, annonces et réservations : jusqu’à ce que tu supprimes ton compte.</li>
        </ul>

        <h2>Où sont les données</h2>
        <p>Okoumé utilise trois services : Render (l’hébergement du site), Neon (la base de données) et Resend (l’envoi des courriels). Leurs serveurs peuvent être situés hors du Québec. Ils traitent les données pour Okoumé seulement.</p>

        <h2>Tes droits</h2>
        <p>Tu peux à tout moment :</p>
        <ul>
          <li>télécharger tout ce qu’on garde sur toi, depuis <Link href="/compte">Mon compte</Link> ;</li>
          <li>supprimer ton compte, au même endroit : tout est effacé tout de suite ;</li>
          <li>demander une correction ou poser une question, à <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. On répond en 30 jours au plus.</li>
        </ul>
        <p>Si une réponse ne te satisfait pas, tu peux t’adresser à la Commission d’accès à l’information du Québec.</p>

        <h2>En cas d’incident</h2>
        <p>Si des données étaient exposées et que ça présente un risque sérieux, on préviendrait les personnes touchées et la Commission d’accès à l’information.</p>
      </div>
    </div></div>
  );
}

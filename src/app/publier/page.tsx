import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer, isMember } from "@/server/dal/session";
import { ListingForm } from "@/components/ListingForm";
import { createListingAction } from "@/server/actions/listings";

export const metadata: Metadata = { title: "Publier un livre" };

export default async function Publish() {
  const v = await getViewer();
  if (!v) redirect("/connexion?next=/publier");
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Publier un livre</h1>
      <p className="lede">Il apparaîtra sur l’étagère, dans le rayon de ton cours.</p>
      {isMember(v) ? (
        <div className="paper top" style={{ marginTop: 32 }}>
          <div className="head"><span>Nouvelle fiche</span><span>Okoumé</span></div>
          <ListingForm action={createListingAction} submitLabel="Mettre sur l’étagère" />
        </div>
      ) : (
        <div className="note-box warn" style={{ marginTop: 32 }}>
          <p>Ton compte attend la validation du comité de l’asso. Tu pourras publier dès qu’il sera validé ; tu recevras un courriel.</p>
          <p style={{ marginTop: 8 }}><Link className="inline" href="/annonces">Parcourir les annonces en attendant</Link></p>
        </div>
      )}
    </div></div>
  );
}

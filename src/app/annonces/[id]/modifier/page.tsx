import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getOwnListingForEdit } from "@/server/dal/listings";
import { getViewer } from "@/server/dal/session";
import { ListingForm } from "@/components/ListingForm";
import { updateListingAction } from "@/server/actions/listings";
import { AppError } from "@/server/errors";

export const metadata: Metadata = { title: "Modifier l’annonce" };

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await getViewer())) redirect(`/connexion?next=/annonces/${id}/modifier`);
  let l;
  try { l = await getOwnListingForEdit(id); } catch (e) { if (e instanceof AppError) notFound(); throw e; }
  const initial = { ...l, price: l.priceCents != null ? String(l.priceCents / 100) : "" } as unknown as Record<string, string>;
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Modifier l’annonce</h1>
      <div className="paper top" style={{ marginTop: 32 }}>
        <div className="head"><span>{l.courseCode}</span><span>Okoumé</span></div>
        <ListingForm action={updateListingAction.bind(null, l.id)} initial={initial} submitLabel="Enregistrer" />
      </div>
    </div></div>
  );
}

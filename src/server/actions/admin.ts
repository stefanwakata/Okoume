"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setMemberStatus, adminRemoveListing } from "@/server/dal/admin";
import { type ActionState, toState, flash } from "./_util";

const statusInput = z.object({ id: z.uuid(), status: z.enum(["approved", "suspended"]) });

export async function setMemberStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const p = statusInput.safeParse({ id: fd.get("id"), status: fd.get("status") });
  if (!p.success) return { ok: false, message: "Demande invalide." };
  try { await setMemberStatus(p.data.id, p.data.status); } catch (e) { return toState(e); }
  revalidatePath("/admin");
  await flash(p.data.status === "approved" ? "Membre validé. Un courriel lui a été envoyé." : "Compte suspendu et déconnecté.");
  return { ok: true };
}

export async function removeListingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const p = z.object({ id: z.uuid(), reason: z.string().trim().min(3, "Indique la raison.").max(200) }).safeParse({ id: fd.get("id"), reason: fd.get("reason") });
  if (!p.success) return { ok: false, message: "Indique la raison du retrait (3 caractères minimum)." };
  try { await adminRemoveListing(p.data.id, p.data.reason); } catch (e) { return toState(e); }
  revalidatePath("/"); revalidatePath("/annonces"); revalidatePath("/admin");
  await flash("Annonce retirée.");
  return { ok: true };
}

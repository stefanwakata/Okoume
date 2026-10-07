"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { listingInput, uuidInput } from "@/lib/validation";
import { createListing, updateListing, withdrawListing } from "@/server/dal/listings";
import { type ActionState, fieldErrors, toState, flash, formValues } from "./_util";

export async function createListingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd);
  const parsed = listingInput.safeParse(values);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), message: "Vérifie les champs en rouge.", values };
  let id: string;
  try { ({ id } = await createListing(parsed.data)); } catch (e) { return { ...toState(e), values }; }
  revalidatePath("/"); revalidatePath("/annonces");
  await flash("Ton livre est sur l’étagère.");
  redirect(`/annonces/${id}`);
}

export async function updateListingAction(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd);
  const idOk = uuidInput.safeParse({ id });
  const parsed = listingInput.safeParse(values);
  if (!idOk.success) return { ok: false, message: "Annonce introuvable." };
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), message: "Vérifie les champs en rouge.", values };
  try { await updateListing(id, parsed.data); } catch (e) { return { ...toState(e), values }; }
  revalidatePath("/"); revalidatePath("/annonces"); revalidatePath(`/annonces/${id}`);
  await flash("Annonce mise à jour.");
  redirect(`/annonces/${id}`);
}

export async function withdrawListingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = uuidInput.safeParse({ id: fd.get("id") });
  if (!parsed.success) return { ok: false, message: "Annonce introuvable." };
  try { await withdrawListing(parsed.data.id); } catch (e) { return toState(e); }
  revalidatePath("/"); revalidatePath("/annonces"); revalidatePath("/compte");
  await flash("Annonce retirée de l’étagère.");
  redirect("/compte");
}

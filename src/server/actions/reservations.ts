"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reservationInput, handOverInput, uuidInput } from "@/lib/validation";
import * as R from "@/server/dal/reservations";
import { type ActionState, fieldErrors, toState, flash } from "./_util";

function refresh() { revalidatePath("/"); revalidatePath("/annonces"); revalidatePath("/compte/reservations"); revalidatePath("/annonces/[id]", "page"); }

export async function requestReservationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = reservationInput.safeParse({ listingId: fd.get("listingId"), message: fd.get("message") ?? undefined });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), message: "Vérifie ton message." };
  try { await R.requestReservation(parsed.data.listingId, parsed.data.message); } catch (e) { return toState(e); }
  refresh();
  await flash("Demande envoyée. La personne reçoit un courriel et te répond ici.");
  redirect("/compte/reservations");
}

async function simple(fd: FormData, fn: (id: string) => Promise<void>, msg: string): Promise<ActionState> {
  const parsed = uuidInput.safeParse({ id: fd.get("id") });
  if (!parsed.success) return { ok: false, message: "Réservation introuvable." };
  try { await fn(parsed.data.id); } catch (e) { return toState(e); }
  refresh();
  await flash(msg);
  redirect("/compte/reservations");
}

export async function acceptAction(_: ActionState, fd: FormData) { return simple(fd, R.acceptReservation, "Demande acceptée. On a envoyé ton courriel à la personne pour fixer le rendez-vous."); }
export async function declineAction(_: ActionState, fd: FormData) { return simple(fd, R.declineReservation, "Demande refusée. Le livre reste disponible."); }
export async function cancelAction(_: ActionState, fd: FormData) { return simple(fd, R.cancelReservation, "Demande annulée."); }
export async function returnedAction(_: ActionState, fd: FormData) { return simple(fd, R.markReturned, "Livre rendu. Il est de retour sur l’étagère."); }

export async function handedAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = handOverInput.safeParse({ reservationId: fd.get("id"), dueDate: fd.get("dueDate") || undefined });
  if (!parsed.success) return { ok: false, message: "Date de retour invalide." };
  try { await R.markHandedOver(parsed.data.reservationId, parsed.data.dueDate); } catch (e) { return toState(e); }
  refresh();
  await flash("C’est noté, le livre a changé de mains.");
  redirect("/compte/reservations");
}

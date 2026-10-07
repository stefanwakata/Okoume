"use client";
import { useActionState } from "react";
import { requestReservationAction } from "@/server/actions/reservations";
import { Btn } from "./Btn";

export function ReserveForm({ listingId, kind }: { listingId: string; kind: "sale" | "loan" }) {
  const [state, action, pending] = useActionState(requestReservationAction, {});
  return (
    <form action={action} className="paper side form" style={{ gap: 14 }}>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="field"><label className="lbl" htmlFor="message">Un mot pour la personne (facultatif)</label>
        <textarea id="message" name="message" maxLength={500} placeholder="Je peux passer mardi après mon cours de 13 h." aria-describedby={state.fieldErrors?.message ? "msg-err" : undefined} />
        {state.fieldErrors?.message && <span className="err" id="msg-err">{state.fieldErrors.message[0]}</span>}
      </div>
      <div><Btn type="submit" disabled={pending}>{pending ? "Envoi…" : kind === "loan" ? "Demander à l’emprunter" : "Réserver ce livre"}</Btn></div>
      <p className="hint muted" style={{ fontSize: 14 }}>La personne reçoit un courriel et accepte ou refuse. Ton courriel ne lui est donné que si elle accepte.</p>
      {state.message && !state.ok && <p className="form-msg err" role="alert">{state.message}</p>}
    </form>
  );
}

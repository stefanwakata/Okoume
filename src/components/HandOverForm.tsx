"use client";
import { useActionState } from "react";
import type { ActionState } from "@/server/actions/_util";
import { handedAction } from "@/server/actions/reservations";
import { Btn } from "./Btn";

// Marks the meeting as done. For a loan, the lender sets the return date (default: end of the current term).
export function HandOverForm({ id, kind, defaultDue }: { id: string; kind: "sale" | "loan"; defaultDue: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(handedAction, {});
  return (
    <form action={action} className="handover">
      <input type="hidden" name="id" value={id} />
      {kind === "loan" && (
        <label className="field"><span>Date de retour</span>
          <input type="date" name="dueDate" defaultValue={defaultDue} required />
        </label>
      )}
      <Btn type="submit" size="sm" disabled={pending}>{pending ? "Un instant…" : kind === "loan" ? "Livre prêté" : "Livre remis"}</Btn>
      {state.message && !state.ok && <span role="alert" className="form-msg err">{state.message}</span>}
    </form>
  );
}

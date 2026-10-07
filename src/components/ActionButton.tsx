"use client";
import { useActionState } from "react";
import type { ActionState } from "@/server/actions/_util";
import { Btn } from "./Btn";

type Action = (s: ActionState, fd: FormData) => Promise<ActionState>;

// A one-button form for state transitions (accept, decline, cancel...). Works without JS; shows the error inline.
export function ActionButton({ action, fields, label, variant, confirm, children }:
  { action: Action; fields: Record<string, string>; label: string; variant?: "line" | "ghost"; confirm?: string; children?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }} style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <Btn type="submit" size="sm" variant={variant} disabled={pending}>{pending ? "Un instant…" : label}</Btn>
      {state.message && !state.ok && <span role="alert" className="form-msg err">{state.message}</span>}
    </form>
  );
}

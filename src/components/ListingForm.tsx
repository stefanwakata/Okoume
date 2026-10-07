"use client";
import { useActionState, useState } from "react";
import type { ActionState } from "@/server/actions/_util";
import { SECTIONS, SCHOOLS, CONDITIONS, SPINE_COLORS } from "@/lib/sections";
import { Btn } from "./Btn";

type Values = Partial<Record<"section" | "courseCode" | "title" | "edition" | "school" | "condition" | "kind" | "price" | "meetingPlace" | "spineColor", string>>;

export function ListingForm({ action, initial, submitLabel }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; initial?: Values; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const v: Values = { ...initial, ...(state.values ?? {}) };
  const [kind, setKind] = useState(v.kind ?? "sale");
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const f = (k: string, hint?: boolean) => ({ "aria-invalid": err(k) ? true : undefined, "aria-describedby": err(k) ? `${k}-err` : hint ? `${k}-hint` : undefined });
  const e = (k: string) => (err(k) ? <span className="err" id={`${k}-err`}>{err(k)}</span> : null);
  return (
    <form action={formAction} className="form" noValidate>
      <div className="row2">
        <div className="field"><label className="lbl" htmlFor="courseCode">Code du cours</label>
          <input id="courseCode" name="courseCode" defaultValue={v.courseCode} placeholder="MAT 1400" autoCapitalize="characters" maxLength={12} required {...f("courseCode")} />
          {e("courseCode")}
        </div>
        <div className="field"><label className="lbl" htmlFor="section">Rayon</label>
          <select id="section" name="section" defaultValue={v.section ?? ""} required {...f("section")}>
            <option value="" disabled>Choisir</option>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {e("section")}
        </div>
      </div>
      <div className="field"><label className="lbl" htmlFor="title">Titre du livre</label>
        <input id="title" name="title" defaultValue={v.title} maxLength={120} required {...f("title")} />
        {e("title")}
      </div>
      <div className="row2">
        <div className="field"><label className="lbl" htmlFor="edition">Édition</label>
          <input id="edition" name="edition" defaultValue={v.edition} placeholder="8e édition" maxLength={40} required {...f("edition")} />
          {e("edition")}
        </div>
        <div className="field"><label className="lbl" htmlFor="condition">État</label>
          <select id="condition" name="condition" defaultValue={v.condition ?? ""} required {...f("condition")}>
            <option value="" disabled>Choisir</option>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
          {e("condition")}
        </div>
      </div>
      <div className="field"><label className="lbl" htmlFor="school">Établissement</label>
        <select id="school" name="school" defaultValue={v.school ?? ""} required {...f("school")}>
          <option value="" disabled>Choisir</option>
          {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
        </select>
        {e("school")}
      </div>
      <fieldset>
        <legend>Tu le vends ou tu le prêtes ?</legend>
        <label><input type="radio" name="kind" value="sale" checked={kind === "sale"} onChange={() => setKind("sale")} /> je le vends</label>
        <label><input type="radio" name="kind" value="loan" checked={kind === "loan"} onChange={() => setKind("loan")} /> je le prête pour la session</label>
      </fieldset>
      {kind === "sale" && (
        <div className="field"><label className="lbl" htmlFor="price">Prix en dollars</label>
          <input id="price" name="price" defaultValue={v.price} inputMode="decimal" placeholder="45" maxLength={8} {...f("price", true)} />
          <span className="hint" id="price-hint">Les livres de l’asso se vendent souvent entre 20 et 60 $.</span>
          {e("price")}
        </div>
      )}
      <div className="field"><label className="lbl" htmlFor="meetingPlace">Lieu de rencontre proposé</label>
        <input id="meetingPlace" name="meetingPlace" defaultValue={v.meetingPlace} placeholder="Pavillon Roger-Gaudry, entrée principale" maxLength={120} required {...f("meetingPlace", true)} />
        <span className="hint" id="meetingPlace-hint">Visible seulement par les membres validés.</span>
        {e("meetingPlace")}
      </div>
      <fieldset>
        <legend>Couleur de la tranche sur l’étagère</legend>
        <div className="swatches">
          {SPINE_COLORS.map((c, i) => (
            <label key={c} title={`Couleur ${i + 1}`}>
              <input type="radio" name="spineColor" value={c} defaultChecked={(v.spineColor ?? SPINE_COLORS[0]) === c} aria-label={`Couleur ${i + 1}`} />
              <i style={{ ["--c" as string]: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Btn type="submit" disabled={pending}>{pending ? "Envoi…" : submitLabel}</Btn>
        {state.message && <p className={`form-msg${state.ok ? "" : " err"}`} role="alert">{state.message}</p>}
      </div>
    </form>
  );
}

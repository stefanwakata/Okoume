"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient, authMessage } from "@/lib/auth-client";
import { Btn } from "./Btn";

export function SignOutButtons() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function out() {
    setPending("out");
    await authClient.signOut();
    router.replace("/"); router.refresh();
  }
  async function everywhere() {
    setPending("all");
    const { error } = await authClient.revokeOtherSessions();
    setPending(null);
    setMsg(error ? authMessage(error) : "Tes autres appareils sont déconnectés.");
  }
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn sm line" type="button" onClick={out} disabled={!!pending}><span className="r">Me déconnecter</span><span className="r" aria-hidden="true">Me déconnecter</span></button>
      <button className="btn sm ghost" type="button" onClick={everywhere} disabled={!!pending}><span className="r">Déconnecter mes autres appareils</span><span className="r" aria-hidden="true">Déconnecter mes autres appareils</span></button>
      {msg && <span role="status" className="form-msg">{msg}</span>}
    </div>
  );
}

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const currentPassword = String(fd.get("current") ?? "");
    const newPassword = String(fd.get("next") ?? "");
    if (newPassword.length < 15) { setMsg({ ok: false, text: "Le nouveau mot de passe doit faire au moins 15 caractères." }); return; }
    setPending(true); setMsg(null);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setPending(false);
    if (error) { setMsg({ ok: false, text: authMessage(error) }); return; }
    form.reset();
    setMsg({ ok: true, text: "Mot de passe changé. Tes autres appareils ont été déconnectés." });
  }
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <label className="field"><span>Mot de passe actuel</span><input name="current" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <div className="field"><label className="lbl" htmlFor="np">Nouveau mot de passe</label><input id="np" name="next" type="password" autoComplete="new-password" required minLength={15} maxLength={128} aria-describedby="np-hint" /><span className="hint" id="np-hint">Au moins 15 caractères.</span></div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Btn type="submit" size="sm" disabled={pending}>{pending ? "Un instant…" : "Changer le mot de passe"}</Btn>
        {msg && <p className={`form-msg${msg.ok ? "" : " err"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    if (fd.get("confirm") !== "on") { setMsg("Coche la case pour confirmer."); return; }
    setPending(true); setMsg(null);
    const { error } = await authClient.deleteUser({ password: String(fd.get("password") ?? "") });
    setPending(false);
    if (error) { setMsg(authMessage(error)); return; }
    router.replace("/?compte-supprime=1"); router.refresh();
  }
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <p>Tes annonces, tes demandes et ton compte sont effacés tout de suite. Ça ne se défait pas.</p>
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <label className="field"><span>Ton mot de passe, pour confirmer</span><input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <fieldset><label><input type="checkbox" name="confirm" /> Je veux supprimer mon compte et mes annonces</label></fieldset>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Btn type="submit" size="sm" disabled={pending}>{pending ? "Suppression…" : "Supprimer mon compte"}</Btn>
        {msg && <p className="form-msg err" role="alert">{msg}</p>}
      </div>
    </form>
  );
}

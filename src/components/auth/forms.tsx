"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient, authMessage } from "@/lib/auth-client";
import { SCHOOLS } from "@/lib/sections";
import { safeNext } from "@/lib/validation";
import { Btn } from "@/components/Btn";

type Errors = Record<string, string | undefined>;

function useSubmit() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  return { pending, setPending, message, setMessage, errors, setErrors };
}

// The <label> holds only the label text; hint and error are linked with aria-describedby (not read twice).
function Field({ name, label, error, hint, children }: { name: string; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field"><label className="lbl" htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <span className="hint" id={`${name}-hint`}>{hint}</span>}
      {error && <span className="err" id={`${name}-err`}>{error}</span>}
    </div>
  );
}
const aria = (name: string, error?: string, hint?: boolean) => ({
  id: name,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${name}-err` : hint ? `${name}-hint` : undefined,
});

function PasswordInput({ name, autoComplete, error, hint }: { name: string; autoComplete: string; error?: string; hint?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw">
      <input name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={autoComplete === "new-password" ? 15 : undefined} maxLength={128} {...aria(name, error, hint)} />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? "Masquer" : "Afficher"}</button>
    </span>
  );
}

function Submit({ pending, label, message }: { pending: boolean; label: string; message: string | null }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <Btn type="submit" disabled={pending}>{pending ? "Un instant…" : label}</Btn>
      {message && <p className="form-msg err" role="alert">{message}</p>}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Connexion ---------- */
export function SignInForm({ next, demo, demoPassword }: { next?: string; demo?: readonly { email: string; name: string; role: string }[]; demoPassword?: string }) {
  const router = useRouter();
  const s = useSubmit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e: string, p: string) {
    s.setPending(true); s.setMessage(null);
    // callbackURL is also where Better Auth redirects after sign-in, and the target of a re-sent confirmation link.
    const target = safeNext(next, "/compte");
    const { error } = await authClient.signIn.email({ email: e, password: p, callbackURL: target });
    s.setPending(false);
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") { router.push(`/verifier-courriel?courriel=${encodeURIComponent(e)}`); return; }
      s.setMessage(authMessage(error)); return;
    }
    router.replace(target);
    router.refresh();
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const errs: Errors = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = "Entre une adresse courriel valide.";
    if (!password) errs.password = "Entre ton mot de passe.";
    s.setErrors(errs);
    if (Object.keys(errs).length) return;
    await login(email.trim(), password);
  }

  return (
    <>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Field name="email" label="Courriel" error={s.errors.email}>
          <input name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required {...aria("email", s.errors.email)} />
        </Field>
        <Field name="password" label="Mot de passe" error={s.errors.password}>
          <span className="pw">
            <input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} {...aria("password", s.errors.password)} />
          </span>
        </Field>
        <Submit pending={s.pending} label="Me connecter" message={s.message} />
        <p className="muted" style={{ fontSize: 16 }}><Link href="/mot-de-passe-oublie">Mot de passe oublié</Link></p>
      </form>
      {demo && demo.length > 0 && (
        <div className="demo-accounts">
          <p className="head"><span>Comptes de démonstration</span></p>
          <ul>
            {demo.map((a) => (
              <li key={a.email}>
                <button type="button" disabled={s.pending} onClick={() => login(a.email, demoPassword ?? "")}>
                  <b>{a.name}</b><span>{a.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ---------- Inscription ---------- */
export function SignUpForm() {
  const router = useRouter();
  const s = useSubmit();

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    const school = String(fd.get("school") ?? "");
    const errs: Errors = {};
    if (name.length < 2 || name.length > 60) errs.name = "Entre ton prénom et ton nom (2 à 60 caractères).";
    if (!EMAIL_RE.test(email)) errs.email = "Entre une adresse courriel valide.";
    if (password.length < 15) errs.password = "Au moins 15 caractères. Une phrase de quatre mots marche bien.";
    if (password.length > 128) errs.password = "Au plus 128 caractères.";
    if (!(SCHOOLS as readonly string[]).includes(school)) errs.school = "Choisis ton établissement.";
    s.setErrors(errs);
    if (Object.keys(errs).length) { (ev.currentTarget.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus(); return; }

    s.setPending(true); s.setMessage(null);
    const { error } = await authClient.signUp.email({ name, email, password, school, callbackURL: "/bienvenue" });
    s.setPending(false);
    // An address that already has an account gets the same screen: no way to probe who is registered.
    if (error && !String(error.code).startsWith("USER_ALREADY_EXISTS")) { s.setMessage(authMessage(error)); return; }
    router.push(`/verifier-courriel?courriel=${encodeURIComponent(email)}&nouveau=1`);
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <Field name="name" label="Prénom et nom" error={s.errors.name} hint="Seul ton prénom est montré aux autres membres.">
        <input name="name" autoComplete="name" maxLength={60} required {...aria("name", s.errors.name, true)} />
      </Field>
      <Field name="email" label="Courriel" error={s.errors.email} hint="Ton adresse étudiante ou personnelle.">
        <input name="email" type="email" autoComplete="email" inputMode="email" required {...aria("email", s.errors.email, true)} />
      </Field>
      <Field name="password" label="Mot de passe" error={s.errors.password} hint="Au moins 15 caractères. Une phrase de quatre mots marche bien.">
        <PasswordInput name="password" autoComplete="new-password" error={s.errors.password} hint />
      </Field>
      <Field name="school" label="Établissement" error={s.errors.school}>
        <select name="school" defaultValue="" required {...aria("school", s.errors.school)}>
          <option value="" disabled>Choisir</option>
          {SCHOOLS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <p className="muted" style={{ fontSize: 15 }}>
        En créant un compte, tu acceptes les <Link href="/conditions">conditions d’utilisation</Link>. On garde ton nom, ton courriel et tes annonces, rien d’autre : voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
      <Submit pending={s.pending} label="Créer mon compte" message={s.message} />
    </form>
  );
}

/* ---------- Renvoyer le lien de confirmation ---------- */
export function ResendVerification({ email: initial }: { email?: string }) {
  const s = useSubmit();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(initial ?? "");
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { s.setErrors({ email: "Entre une adresse courriel valide." }); return; }
    s.setErrors({}); s.setPending(true); s.setMessage(null);
    const { error } = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: "/bienvenue" });
    s.setPending(false);
    if (error && error.status === 429) { s.setMessage(authMessage(error)); return; }
    setSent(true); // same answer whether or not the address exists
  }
  if (sent) return <p role="status">C’est envoyé. Si l’adresse a un compte en attente de confirmation, le nouveau lien arrive d’ici quelques minutes.</p>;
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <Field name="email" label="Courriel" error={s.errors.email}>
        <input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required {...aria("email", s.errors.email)} />
      </Field>
      <Submit pending={s.pending} label="Renvoyer le lien" message={s.message} />
    </form>
  );
}

/* ---------- Mot de passe oublié ---------- */
export function ForgotForm() {
  const s = useSubmit();
  const [sent, setSent] = useState(false);
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const email = String(new FormData(ev.currentTarget).get("email") ?? "").trim();
    if (!EMAIL_RE.test(email)) { s.setErrors({ email: "Entre une adresse courriel valide." }); return; }
    s.setErrors({}); s.setPending(true); s.setMessage(null);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reinitialiser" });
    s.setPending(false);
    if (error && error.status === 429) { s.setMessage(authMessage(error)); return; }
    setSent(true);
  }
  if (sent) return <div className="note-box" role="status"><p>Si un compte existe pour cette adresse, un lien pour choisir un nouveau mot de passe vient de partir. Il est valide 30 minutes.</p></div>;
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <Field name="email" label="Courriel du compte" error={s.errors.email}>
        <input name="email" type="email" autoComplete="email" required {...aria("email", s.errors.email)} />
      </Field>
      <Submit pending={s.pending} label="Recevoir le lien" message={s.message} />
    </form>
  );
}

/* ---------- Nouveau mot de passe ---------- */
export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const s = useSubmit();
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const password = String(new FormData(ev.currentTarget).get("password") ?? "");
    if (password.length < 15) { s.setErrors({ password: "Au moins 15 caractères." }); return; }
    s.setErrors({}); s.setPending(true); s.setMessage(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    s.setPending(false);
    if (error) { s.setMessage(authMessage(error)); return; }
    router.replace("/connexion?reinitialise=1");
  }
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <Field name="password" label="Nouveau mot de passe" error={s.errors.password} hint="Au moins 15 caractères. Tes autres sessions seront fermées.">
        <PasswordInput name="password" autoComplete="new-password" error={s.errors.password} hint />
      </Field>
      <Submit pending={s.pending} label="Enregistrer" message={s.message} />
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Forgot() {
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Mot de passe oublié</h1>
      <p className="lede">Entre l’adresse de ton compte. On t’envoie un lien pour en choisir un nouveau.</p>
      <div className="paper top" style={{ marginTop: 32 }}>
        <div className="head"><span>Nouveau mot de passe</span><span>Okoumé</span></div>
        <ForgotForm />
      </div>
      <p style={{ marginTop: 24 }}><Link className="inline" href="/connexion">Retour à la connexion</Link></p>
    </div></div>
  );
}

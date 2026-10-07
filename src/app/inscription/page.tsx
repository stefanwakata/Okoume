import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/dal/session";
import { SignUpForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Créer un compte", description: "Un compte Okoumé pour publier tes livres de cours et réserver ceux des autres membres de l’asso." };

export default async function SignUp() {
  if (await getViewer()) redirect("/compte");
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Créer un compte</h1>
      <p className="lede">Trois étapes : tu crées ton compte, tu confirmes ton courriel, puis le comité de l’asso te valide. Déjà inscrit ? <Link className="inline" href="/connexion">Connecte-toi</Link>.</p>
      <div className="paper top" style={{ marginTop: 32 }}>
        <div className="head"><span>Fiche d’inscription</span><span>Okoumé</span></div>
        <SignUpForm />
      </div>
    </div></div>
  );
}

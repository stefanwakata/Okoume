import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/dal/session";
import { SignInForm } from "@/components/auth/forms";
import { isDemo } from "@/lib/env";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; reinitialise?: string }> }) {
  const sp = await searchParams;
  if (await getViewer()) redirect(safeNext(sp.next, "/compte"));
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Connexion</h1>
      <p className="lede">Pas encore de compte ? <Link className="inline" href="/inscription">Crée-le en deux minutes</Link>.</p>
      {sp.reinitialise && <div className="note-box" role="status" style={{ marginTop: 24 }}><p>Mot de passe changé. Connecte-toi avec le nouveau.</p></div>}
      <div className="paper top" style={{ marginTop: 32 }}>
        <div className="head"><span>Carte de membre</span><span>Okoumé</span></div>
        <SignInForm next={sp.next} demo={isDemo ? DEMO_ACCOUNTS : undefined} demoPassword={isDemo ? DEMO_PASSWORD : undefined} />
      </div>
    </div></div>
  );
}

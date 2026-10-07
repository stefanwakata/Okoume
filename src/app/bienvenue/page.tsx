import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer, isMember } from "@/server/dal/session";
import { Btn } from "@/components/Btn";

export const metadata: Metadata = { title: "Adresse confirmée" };

// Landing page of the confirmation link (Better Auth redirects here, with ?error=… when the token is bad).
export default async function Welcome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  if (sp.error) redirect("/verifier-courriel?error=1");
  const v = await getViewer();
  return (
    <div className="page"><div className="wrap narrow">
      <h1>Adresse confirmée</h1>
      {!v ? (
        <><p className="lede">Tu peux maintenant te connecter.</p><p style={{ marginTop: 28 }}><Btn href="/connexion">Me connecter</Btn></p></>
      ) : isMember(v) ? (
        <><p className="lede">Ton compte est validé : l’étagère est à toi.</p><p style={{ marginTop: 28 }}><Btn href="/publier">Publier un livre</Btn></p></>
      ) : (
        <>
          <p className="lede">Merci {v.name.split(" ")[0]}. Dernière étape : quelqu’un du comité de l’asso valide ton compte, en général dans la journée. Tu recevras un courriel.</p>
          <p style={{ marginTop: 28 }}><Btn href="/annonces" variant="line">Parcourir les annonces en attendant</Btn></p>
        </>
      )}
    </div></div>
  );
}

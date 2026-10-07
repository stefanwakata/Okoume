import Link from "next/link";
import { Shelf, type ShelfBook } from "@/components/Shelf";
import { listShelf } from "@/server/dal/listings";
import { getViewer } from "@/server/dal/session";
import { priceLabel, sectionIndex } from "@/lib/present";

export default async function Home() {
  const [rows, viewer] = await Promise.all([listShelf(), getViewer()]);
  const books: ShelfBook[] = rows.slice(0, 80).map((l) => ({
    id: l.id, r: sectionIndex(l.section), code: l.courseCode, title: l.title, ed: l.edition,
    school: l.school, state: l.condition, price: priceLabel(l.kind, l.priceCents), color: l.spineColor,
  }));
  return (
    <>
      <Shelf books={books} signedIn={!!viewer} />

      <section className="pg slip-sec" id="comment" aria-labelledby="h-steps">
        <div className="wrap">
          <div>
            <h2 className="big" id="h-steps">Comment ça marche</h2>
            <p className="lede">Comme un livre de bibliothèque : il sort, il circule, il revient. Sauf qu’ici, c’est entre membres de l’asso.</p>
          </div>
          <div className="slip">
            <div className="head"><span>Fiche de circulation</span><span>Okoumé</span></div>
            <table>
              <thead><tr><th scope="col">Étape</th><th scope="col">Ce qui se passe</th><th scope="col" className="who">Qui</th></tr></thead>
              <tbody>
                <tr><td>1</td><td><b>Tu mets ton livre sur l’étagère</b>Le titre, le cours, l’édition, l’état, et si tu le vends ou si tu le prêtes pour la session.</td><td className="who">Toi</td></tr>
                <tr><td>2</td><td><b>Quelqu’un de l’asso le réserve</b>Tu reçois un courriel et tu acceptes ou refuses. Seuls les membres validés par le comité peuvent réserver.</td><td className="who">Un membre</td></tr>
                <tr><td>3</td><td><b>Vous vous voyez sur le campus</b>Tu indiques que le livre a changé de mains. Si c’est un prêt, on rappelle la date de retour trois jours avant.</td><td className="who">Vous deux</td></tr>
              </tbody>
            </table>
            <div className="due" aria-hidden="true">RENDU</div>
          </div>
        </div>
      </section>

      <section className="pg faq" id="questions" aria-labelledby="h-faq">
        <div className="wrap"><div className="col">
          <h2 className="big" id="h-faq">Questions</h2>
          <details><summary>C’est payant ?</summary><p>Non. Le compte est gratuit et Okoumé ne prend rien sur les ventes. L’argent passe de main à main, entre vous.</p></details>
          <details><summary>Pourquoi pas Facebook ou Kijiji ?</summary><p>Ici, tout le monde fait partie de l’asso, les annonces sont classées par cours et elles ne se perdent pas sous dix autres publications.</p></details>
          <details><summary>Qui peut réserver ?</summary><p>Les membres de l’association, une fois leur compte validé par le comité. Tout le monde peut parcourir l’étagère.</p></details>
          <details><summary>Et si la personne ne vient pas ?</summary><p>Chaque compte est lié à l’asso. Écris au comité : un compte qui pose problème peut être suspendu.</p></details>
          <details><summary>Je peux prêter au lieu de vendre ?</summary><p>Oui. Tu choisis la date de retour au moment de remettre le livre, et on envoie un rappel trois jours avant.</p></details>
        </div></div>
      </section>

      {!viewer && (
        <section className="pg join" aria-labelledby="h-join">
          <div className="wrap">
            <div>
              <h2 className="big" id="h-join">Garde-toi une place sur l’étagère.</h2>
              <p className="lede">Crée ton compte avec ton courriel. Le comité de l’asso le valide, puis tu peux publier et réserver.</p>
            </div>
            <div className="member">
              <div className="head"><span>Carte de membre</span><span>Okoumé</span></div>
              <p style={{ fontSize: 19 }}>Il te faut deux minutes : ton prénom, ton courriel, ton établissement et un mot de passe.</p>
              <p style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="btn" href="/inscription"><span className="r">Créer mon compte</span><span className="r" aria-hidden="true">Créer mon compte</span></Link>
                <Link className="btn line" href="/connexion" style={{ color: "var(--paper-ink)", boxShadow: "inset 0 0 0 1.5px var(--paper-ink)" }}><span className="r">J’ai déjà un compte</span><span className="r" aria-hidden="true">J’ai déjà un compte</span></Link>
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

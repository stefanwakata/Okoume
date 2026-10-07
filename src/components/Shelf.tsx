"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { mountShelf } from "./shelf-engine";
import { SECTIONS } from "@/lib/sections";

export type ShelfBook = { id: string; r: number; code: string; title: string; ed: string; school: string; state: string; price: string; color: string };

function loadThree(): Promise<void> {
  const w = window as unknown as { THREE?: unknown };
  if (w.THREE) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "/vendor/three.min.js";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // engine falls back to the list
    document.head.appendChild(s);
  });
}

export function Shelf({ books, signedIn }: { books: ShelfBook[]; signedIn: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    loadThree().then(() => {
      if (cancelled || !root.current) return;
      const ranges = SECTIONS.map((s) => ({ name: s.name, code: s.codes }));
      cleanup = mountShelf(root.current, books, ranges);
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [books]);

  return (
    <div ref={root} className="shelf-root">
      <section className="shelf" id="top" aria-label="L’étagère des annonces">
        <div className="stage" id="stage">
          <canvas id="gl" aria-hidden="true"></canvas>
          <div className="shade" aria-hidden="true"></div>
          <div className="loader" id="loader">On range l’étagère…</div>

          <div className="cap c0 on" data-from="0" data-to="0.1">
            <h1>Okoumé</h1>
            <p>Les manuels des étudiants gabonais de Montréal, rangés sur une seule étagère. Tu vends ou tu prêtes les tiens à quelqu’un de l’asso.</p>
            <div className="hint"><span>Défile pour longer l’étagère</span><span id="hintTap">Clique sur un livre pour voir l’annonce</span></div>
          </div>
          <div className="cap c1" data-from="0.1" data-to="0.36">
            <h2>Chaque tranche est une annonce.</h2>
            <p>Le code du cours en haut, l’édition au milieu, le prix en bas. Un livre marqué « prêt » se rend à la fin de la session.</p>
          </div>
          <div className="cap c2" data-from="0.36" data-to="0.66">
            <h2>Classés par cours, comme à la bibliothèque.</h2>
            <p>Sciences, génie, gestion, droit. Tu trouves ton cours sans fouiller dans un groupe Facebook.</p>
          </div>
          <div className="cap c3" data-from="0.66" data-to="0.9">
            <h2>Tu réserves, vous vous voyez sur le campus.</h2>
            <p>Pas de livraison, pas de commission. Tu récupères le livre entre deux cours ou à la prochaine soirée de l’asso.</p>
          </div>
          <div className="cap c4" data-from="0.9" data-to="1.01">
            <h2>Il reste de la place sur l’étagère.</h2>
            <p>{signedIn ? "Ton prochain livre peut aller dans cet espace vide." : "Crée ton compte : une fois validé par le comité, ton premier livre ira dans cet espace vide."}</p>
            <Link className="btn" href={signedIn ? "/publier" : "/inscription"}>
              <span className="r">{signedIn ? "Publier un livre" : "Créer mon compte"}</span>
              <span className="r" aria-hidden="true">{signedIn ? "Publier un livre" : "Créer mon compte"}</span>
            </Link>
          </div>

          <div className="fallback" id="fallback" aria-label="Annonces"></div>
          <div className="tip" id="tip" aria-hidden="true"></div>
          <div className="index" id="index" aria-label="Rayons de l’étagère"></div>
        </div>
      </section>

      <div className="veil" id="veil"></div>
      <article className="card" id="card" role="dialog" aria-modal="true" aria-labelledby="cardT" aria-hidden="true">
        <button className="x" id="cardX" type="button" aria-label="Fermer l’annonce">×</button>
        <div className="meta"><span id="cardCode"></span><span>Fiche</span></div>
        <h3 id="cardT"></h3>
        <dl id="cardDl"></dl>
        <div className="price" id="cardP"></div>
        <div className="row">
          {/* The shelf engine sets this href imperatively for the picked book; a full navigation is fine here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="btn" id="cardLink" href="/annonces"><span className="r">Voir l’annonce</span><span className="r" aria-hidden="true">Voir l’annonce</span></a>
          <button className="btn line" id="cardC" type="button"><span className="r">Remettre sur l’étagère</span><span className="r" aria-hidden="true">Remettre sur l’étagère</span></button>
        </div>
      </article>

      <dialog className="list" id="list" aria-labelledby="listT">
        <div className="lhead"><h2 id="listT">Toute l’étagère</h2><button className="x" id="listX" type="button" aria-label="Fermer la liste">×</button></div>
        <div id="listBody"></div>
      </dialog>
    </div>
  );
}

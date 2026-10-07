"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Btn } from "./Btn";

type Props = { signedIn: boolean; isAdmin: boolean; canPublish: boolean };

export function Header({ signedIn, isAdmin, canPublish }: Props) {
  const path = usePathname();
  // The menu remembers the page it was opened on, so it closes by itself after a navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const cur = (href: string) => (href === "/" ? path === "/" : path.startsWith(href)) ? "page" : undefined;
  return (
    <nav className="site-nav" aria-label="Navigation principale">
      <Link className="mark" href="/">Okoumé</Link>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpenOn(open ? null : path)}>
        {open ? "Fermer" : "Menu"}
      </button>
      <div className={`links${open ? " open" : ""}`} id="nav-links">
        <Link href="/" aria-current={cur("/")}>L’étagère</Link>
        <Link href="/annonces" aria-current={cur("/annonces")}>Annonces</Link>
        {signedIn && <Link href="/compte/reservations" aria-current={cur("/compte/reservations")}>Réservations</Link>}
        {signedIn && <Link href="/compte" aria-current={path === "/compte" ? "page" : undefined}>Mon compte</Link>}
        {isAdmin && <Link href="/admin" aria-current={cur("/admin")}>Comité</Link>}
        {!signedIn && <Link href="/connexion" aria-current={cur("/connexion")}>Connexion</Link>}
        {signedIn ? (canPublish && <Btn href="/publier">Publier un livre</Btn>) : <Btn href="/inscription">Créer un compte</Btn>}
      </div>
    </nav>
  );
}

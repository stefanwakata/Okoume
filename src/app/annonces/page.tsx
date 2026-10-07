import type { Metadata } from "next";
import Link from "next/link";
import { searchListings } from "@/server/dal/listings";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { priceLabel, statusLabel, sectionName } from "@/lib/present";

export const metadata: Metadata = { title: "Annonces", description: "Toutes les annonces de manuels de l’association, par cours." };

export default async function Listings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const section = SECTIONS.some((s) => s.id === sp.rayon) ? (sp.rayon as SectionId) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pages } = await searchListings({ q: q || undefined, section, page });
  const qs = (p: number) => `?${new URLSearchParams({ ...(q && { q }), ...(section && { rayon: section }), page: String(p) })}`;
  return (
    <div className="page"><div className="wrap">
      <h1>Annonces</h1>
      <p className="lede">Cherche par code de cours ou par titre. {total} {total > 1 ? "livres" : "livre"} sur l’étagère.</p>
      <form className="searchbar" role="search" action="/annonces">
        <label className="grow">Code de cours ou titre<input name="q" defaultValue={q} placeholder="MAT 1400, Physique…" /></label>
        <label>Rayon
          <select name="rayon" defaultValue={section ?? ""}>
            <option value="">Tous</option>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <button className="btn" type="submit"><span className="r">Chercher</span><span className="r" aria-hidden="true">Chercher</span></button>
      </form>
      {rows.length === 0 ? (
        <div className="empty">
          <p>Aucune annonce {q ? <>pour « {q} »</> : "pour l’instant"}{section ? ` dans le rayon ${sectionName(section)}` : ""}.</p>
          <p style={{ marginTop: 8 }}>Essaie seulement le sigle (par exemple MAT), ou <Link className="inline" href="/publier">publie le tien</Link>.</p>
        </div>
      ) : (
        <div className="rows">
          {rows.map((l) => (
            <Link key={l.id} href={`/annonces/${l.id}`} className="lrow" style={{ ["--c" as string]: l.spineColor }}>
              <i aria-hidden="true"></i>
              <span><b>{l.courseCode}</b>{l.title}, {l.edition}<span className="meta">{sectionName(l.section)}, {l.school}, {l.condition.toLowerCase()}</span></span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {l.status !== "available" && <span className="status-tag">{statusLabel[l.status]}</span>}
                <em>{priceLabel(l.kind, l.priceCents)}</em>
              </span>
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="pager" aria-label="Pages">
          {page > 1 && <Link href={qs(page - 1)}>Page précédente</Link>}
          <span>Page {page} sur {pages}</span>
          {page < pages && <Link href={qs(page + 1)}>Page suivante</Link>}
        </nav>
      )}
    </div></div>
  );
}

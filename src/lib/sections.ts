// Shelf ranges, like the range labels in a library.
export const SECTIONS = [
  { id: "sciences", name: "Sciences", codes: "MAT, PHY, CHM, BIO" },
  { id: "genie", name: "Génie et info", codes: "IFT, ING, MATH" },
  { id: "gestion", name: "Gestion et économie", codes: "ECN, FIN, ADM" },
  { id: "droit", name: "Droit et sciences humaines", codes: "DRT, PSY, SOL" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];
export const SECTION_IDS = SECTIONS.map((s) => s.id) as [SectionId, ...SectionId[]];
export const sectionName = (id: string) => SECTIONS.find((s) => s.id === id)?.name ?? id;

export const SCHOOLS = [
  "Université de Montréal", "McGill", "Concordia", "UQAM",
  "Polytechnique Montréal", "HEC Montréal", "ÉTS", "Un cégep", "Autre",
] as const;

export const CONDITIONS = ["Comme neuf", "Très bon", "Bon", "Annoté", "Abîmé"] as const;

// Spine colors offered when publishing (cloth colors of real textbooks)
export const SPINE_COLORS = ["#7a2e2a", "#2f4a5e", "#d1b45a", "#3f6655", "#b4543f", "#5a5f66", "#20384a", "#8a6d3b", "#2d5446", "#6b3045", "#1f2c3a", "#9a4a2f", "#4b5a3a"] as const;

export function priceLabel(kind: string, priceCents: number | null) {
  if (kind === "loan") return "Prêt";
  if (priceCents == null) return "";
  const d = priceCents / 100;
  return (Number.isInteger(d) ? String(d) : d.toFixed(2).replace(".", ",")) + " $";
}

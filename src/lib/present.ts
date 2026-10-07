import { SECTIONS, priceLabel, sectionName } from "@/lib/sections";

export const statusLabel: Record<string, string> = { available: "Disponible", reserved: "Réservé", lent: "En prêt", closed: "Vendu", removed: "Retiré" };
export const reservationLabel: Record<string, string> = {
  requested: "En attente de réponse", accepted: "Acceptée", declined: "Refusée", cancelled: "Annulée",
  handed: "En prêt", returned: "Rendu", completed: "Remis",
};
export const sectionIndex = (id: string) => Math.max(0, SECTIONS.findIndex((s) => s.id === id));
export { priceLabel, sectionName };
export const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "America/Toronto" }).format(typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00Z" : "")) : d);

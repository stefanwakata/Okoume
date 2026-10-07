import { z } from "zod";
import { SECTION_IDS, CONDITIONS, SCHOOLS, SPINE_COLORS } from "@/lib/sections";

const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} : au moins ${min} caractères.`).max(max, `${label} : ${max} caractères maximum.`);

export const listingInput = z
  .object({
    section: z.enum(SECTION_IDS, { error: "Choisis un rayon." }),
    courseCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2,5}\s?\d{3,4}[A-Z]?$/, "Code de cours attendu, par exemple MAT 1400.")
      .transform((s) => s.replace(/^([A-Z]+)\s?(\d)/, "$1 $2")),
    title: text(2, 120, "Titre"),
    edition: text(1, 40, "Édition"),
    school: z.enum(SCHOOLS, { error: "Choisis un établissement." }),
    condition: z.enum(CONDITIONS, { error: "Choisis l’état du livre." }),
    kind: z.enum(["sale", "loan"], { error: "Vente ou prêt ?" }),
    price: z.string().trim().optional(),
    meetingPlace: text(2, 120, "Lieu de rencontre"),
    spineColor: z.enum(SPINE_COLORS).default(SPINE_COLORS[0]),
  })
  .transform((v, ctx) => {
    let priceCents: number | null = null;
    if (v.kind === "sale") {
      const n = Number((v.price ?? "").replace(",", ".").replace(/\s|\$/g, ""));
      if (!v.price || !Number.isFinite(n) || n < 0 || n > 1000) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Prix entre 0 et 1000 $." });
        return z.NEVER;
      }
      priceCents = Math.round(n * 100);
    }
    const { price: _p, ...rest } = v;
    return { ...rest, priceCents };
  });
export type ListingInput = z.output<typeof listingInput>;

export const reservationInput = z.object({
  listingId: z.uuid(),
  message: z.string().trim().max(500, "500 caractères maximum.").optional().transform((s) => (s ? s : null)),
});

export const handOverInput = z.object({
  reservationId: z.uuid(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const uuidInput = z.object({ id: z.uuid() });

export function safeNext(next: unknown, fallback = "/") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

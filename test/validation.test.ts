import { describe, it, expect } from "vitest";
import { listingInput, safeNext } from "@/lib/validation";

const base = { section: "sciences", courseCode: "mat1400", title: "Calcul", edition: "8e", school: "UQAM", condition: "Bon", kind: "sale", price: "45", meetingPlace: "Pavillon A", spineColor: "#7a2e2a" };

describe("listingInput", () => {
  it("normalise le code de cours et convertit le prix en cents", () => {
    const r = listingInput.parse(base);
    expect(r.courseCode).toBe("MAT 1400");
    expect(r.priceCents).toBe(4500);
  });
  it("accepte la virgule et le signe $", () => {
    expect(listingInput.parse({ ...base, price: "12,50 $" }).priceCents).toBe(1250);
  });
  it("un prêt n’a pas de prix, même si un prix est envoyé", () => {
    expect(listingInput.parse({ ...base, kind: "loan", price: "99" }).priceCents).toBeNull();
  });
  it.each([["", "vide"], ["-3", "négatif"], ["1001", "trop cher"], ["abc", "pas un nombre"]])("refuse un prix %s (%s)", (price) => {
    const r = listingInput.safeParse({ ...base, price });
    expect(r.success).toBe(false);
  });
  it("refuse un code de cours invalide, un état ou un établissement hors liste", () => {
    expect(listingInput.safeParse({ ...base, courseCode: "1400" }).success).toBe(false);
    expect(listingInput.safeParse({ ...base, condition: "Neuf" }).success).toBe(false);
    expect(listingInput.safeParse({ ...base, school: "Harvard" }).success).toBe(false);
    expect(listingInput.safeParse({ ...base, spineColor: "red" }).success).toBe(false);
  });
});

describe("safeNext", () => {
  it.each([["/compte", "/compte"], ["//evil.com", "/"], ["/\\evil.com", "/"], ["https://evil.com", "/"], [undefined, "/"], [42, "/"]])("%s → %s", (input, out) => {
    expect(safeNext(input)).toBe(out);
  });
});

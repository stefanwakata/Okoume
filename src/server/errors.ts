// Expected errors: actions turn them into messages; never shown as stack traces.
export class AppError extends Error {
  constructor(public code: "unauthorized" | "forbidden" | "not_found" | "conflict" | "limit" | "invalid", message: string) {
    super(message);
  }
}
export const notFound = () => new AppError("not_found", "Cette annonce n’existe pas ou n’est plus disponible.");
export const unauthorized = () => new AppError("unauthorized", "Connecte-toi pour continuer.");
export const forbidden = (m = "Ton compte n’a pas accès à cette action.") => new AppError("forbidden", m);

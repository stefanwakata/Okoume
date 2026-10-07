"use client";
// Last resort when the root layout itself fails: no app CSS is guaranteed, so styles are inline.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr-CA">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#132029", color: "#eef0ec", fontFamily: "Georgia, serif", padding: 24 }}>
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 40, margin: 0 }}>Okoumé est indisponible</h1>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: "#a9b7bf" }}>Un problème empêche d’afficher le site. Réessaie dans une minute.</p>
          <button type="button" onClick={() => retry()} style={{ marginTop: 16, height: 48, padding: "0 22px", border: 0, background: "#b4543f", color: "#fff", fontSize: 17, cursor: "pointer" }}>Réessayer</button>
        </main>
      </body>
    </html>
  );
}

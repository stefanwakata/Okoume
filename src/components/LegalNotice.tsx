import { isDemo } from "@/lib/env";

export function LegalNotice() {
  if (!isDemo) return null;
  return (
    <div className="note-box warn" style={{ marginTop: 24 }}>
      <p>Version de démonstration. Avant un vrai lancement, l’asso remplace le nom de la personne responsable et l’adresse de contact, et fait relire ce texte.</p>
    </div>
  );
}

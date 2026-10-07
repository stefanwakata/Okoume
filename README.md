# Okoumé

Plateforme d'échange de manuels scolaires pour l'association des étudiants gabonais à Montréal : les membres vendent ou prêtent leurs livres de cours et se donnent rendez-vous sur le campus.

Next.js 16, React 19, Better Auth, Drizzle ORM, PostgreSQL (Neon), déployé sur Render.

## Lancer en local

```bash
npm install
cp .env.example .env   # remplir DATABASE_URL et BETTER_AUTH_SECRET
npm run db:migrate
npm run db:seed        # données de démonstration
npm run dev
```

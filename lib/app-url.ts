/**
 * Public base URL of the app. NEXT_PUBLIC_APP_URL wins, except a localhost
 * value on Vercel (a copied .env.local) — then use Vercel's production domain.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const isLocal = !explicit || /localhost|127\.0\.0\.1/.test(explicit);
  if (explicit && !(isLocal && process.env.VERCEL)) return explicit.replace(/\/+$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return "http://localhost:3000";
}

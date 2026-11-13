# The Good Edit — Admin CMS and Analytics setup

This phase adds an authenticated admin area, article/product publishing API and first-party event analytics. The public site continues to work with its starter content if the database is not connected.

## 1. Create a Cloudflare D1 database

In Cloudflare Dashboard:
1. Open **Workers & Pages → D1 SQL Database**.
2. Create a database named `the-good-edit-db`.
3. Open its Console and execute the complete contents of `schema.sql`.

## 2. Bind D1 to the Pages project

Open the Pages project `affliliate-website-main`:
1. **Settings → Functions → D1 database bindings**.
2. Add a binding with variable name exactly `DB`.
3. Select `the-good-edit-db`.
4. Save and trigger a new deployment.

## 3. Add server-side secrets

In the Pages project:
1. **Settings → Variables and Secrets**.
2. Add these as encrypted secrets (not plain-text build variables):
   - `ADMIN_EMAIL`: allowed admin email address(es), separated by commas. For two admins using the same password, enter `first@example.com,second@example.com`.
   - `ADMIN_PASSWORD`: a new, unique, strong password.
   - `SESSION_SECRET`: a random secret of at least 32 characters.
3. Add them for the **Production** environment. Add Preview secrets only if you intend to test admin on preview deployments.
4. Redeploy after saving.

Do not put these values in React code, GitHub files, or public environment variables. Never share the password or session secret in chat.

## 4. Admin pages

- Login: `https://affliliate-website-main.pages.dev/admin`
- Dashboard: `https://affliliate-website-main.pages.dev/admin`
- Articles and affiliate product links can be saved as drafts or published.
- Analytics records page views and affiliate-link clicks after D1 is connected.

## 5. What analytics means

The dashboard reports events recorded by this website from the time tracking is deployed. It does not import historical views. Page views are event counts, not guaranteed unique people. Affiliate clicks are outbound link clicks, not Amazon orders or commissions. Amazon order/commission reporting remains in Amazon Associates.

## 6. Image handling

For this first CMS version, article and product images use image URLs. A later R2 integration can provide direct uploads. Use images you own or are licensed to use.

## 7. Security notes

The admin session is an HttpOnly, Secure, SameSite cookie signed on the server and expires after eight hours. API writes require an authenticated session and same-origin requests. All listed admin emails currently share the same `ADMIN_PASSWORD`. Anyone who knows that shared password and has an allowed email can sign in. Use a strong password, enable MFA on your Cloudflare and GitHub accounts, and do not expose admin credentials.

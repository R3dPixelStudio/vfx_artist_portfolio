# Cloudflare Pages deployment

Use **Cloudflare Pages**, with a Next.js static export and the existing Pages Functions. Do not create a Workers deployment for this version.

## Connect GitHub

Workers & Pages → Create application → **Pages** → Connect to Git. Select R3dPixelStudio/vfx_artist_portfolio.

| Setting | Value |
| --- | --- |
| Production branch | master |
| Framework preset | Next.js (Static HTML Export) |
| Root directory | Repository root; leave empty |
| Build command | npm run build |
| Build output directory | out |
| Build variable | NODE_VERSION = 22 |

If the creation form requires a Workers deploy command, return to the Pages flow. Do not use next-on-pages, next start, .next as the output directory, or npx wrangler deploy.

Git-connected Pages builds compile the root functions/ directory alongside the static export. Dashboard drag-and-drop of out alone does not include this backend.

## D1 database

1. Storage & databases → D1 → Create database: **vfx-studio**.
2. Open its Console and execute the complete [database schema](../migrations/0001_studio.sql). It creates posts, settings, sessions and rate-limit tables using IF NOT EXISTS.
3. Pages project → Settings → Bindings → Add → D1 database.
4. Binding name: **CMS_DB**. Select vfx-studio and save for Production.
5. For preview backends, bind a separate preview database and initialize it with the same schema.

Production bindings are managed in the Cloudflare dashboard. **wrangler.local.jsonc** is explicitly selected by local preview commands; it is not an automatic production configuration. Its dummy local database ID must never be used as a production ID.

The visual showcase can deploy without D1; admin publishing and AI replies require the backend configuration.

## Variables and secrets

In Pages project → Settings → Variables and Secrets, configure Production:

| Name | Kind | Value |
| --- | --- | --- |
| ADMIN_PASSWORD_HASH | Secret | Output from npm run admin:password |
| RATE_LIMIT_SALT | Secret | Long random private value |
| GROQ_API_KEY | Secret | Your Groq key, when available |
| SITE_URL | Plain variable | Actual HTTPS origin without a trailing slash |
| NEXT_PUBLIC_SITE_URL | Build variable | Same HTTPS origin |
| GROQ_MODEL | Optional plain variable | llama-3.3-70b-versatile |
| CHAT_DAILY_LIMIT | Optional plain variable | 200 |

Use the hostname Cloudflare actually assigns, for example https://YOUR-PROJECT.pages.dev, or your configured custom domain.

Run **npm run admin:password** in your own local terminal. Enter your password into its hidden prompt, then put the resulting hash in Cloudflare. Keep the password and all secrets out of GitHub and chat.

Generate RATE_LIMIT_SALT locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The assistant honestly reports unavailable AI service until a Groq key is configured. Contact links come from the admin profile.

## Redeploy and use

Retry the latest production deployment after saving bindings and variables.

- /en/ and /fa/: home, with /about/, /works/ and /contact/ under each locale.
- /admin/: sign in using your chosen password, configure profile and contact links, publish articles.
- /blog/: published journal.
- /api/profile: profile and chat configuration response.
- /sitemap.xml: portfolio section pages and published articles.

When adding a custom domain, update both origin variables and redeploy to regenerate canonical and language-alternate URLs.

## Release verification

On 2026-10-20, **npm run build** passed strict TypeScript compilation and generated all 14 static routes. **npm run build:functions** compiled the Pages Functions bundle.

This release fixes the texture-image typing that blocked production builds and separates the dummy local D1 binding from production. The particle visuals are preserved.

Live Cloudflare configuration, authentication, D1 publishing and real Groq responses remain unverified. No Cloudflare database or secrets were provisioned during local build validation.

References: [Static Next.js on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/), [Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/).

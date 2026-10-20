# Arman Mehr — Particle Portfolio

A bilingual, click-driven particle journey for a VFX freelancer. English is primary; Persian has its own RTL route. Arman Mehr is an explicitly labelled imaginary identity, editable in the admin.

## Architecture

- Next.js App Router + TypeScript exports the experience and admin shell.
- R3F/Three.js draws the flowing particle portal: 76,000 points on desktop and 28,000 on mobile/Eco, with bounded DPR. The landing and Works reuse one image-particle renderer (45,056 points, or 17,600 on mobile/Eco), mounting only the active section’s image canvas.
- Next.js section URLs own navigation; Zustand tracks the displayed phase, locale, motion and quality. One GSAP timeline owns camera travel and DOM transitions. A persistent locale layout retains the WebGL scene between sections. No scroll-driven scenes.
- Lottie supplies the assistant micro-interaction. Motion respects system preferences until the visitor explicitly enables it.
- Cloudflare Pages Functions serve the Groq gateway, authenticated admin API, and D1-backed journal HTML. Published articles do not require a frontend rebuild.
- Tailwind CSS 4 and logical CSS properties support both directions.

## Local work

Node 22+ is required.

```sh
npm ci
npm run dev
npm run check
```

Next development and `npm run preview:static` only serve the frontend. APIs and journal pages require the full Pages preview:

```sh
npm run build
npm run db:migrate:local
npm run preview
```

Copy `.dev.vars.example` to `.dev.vars` for local secrets. Set `ADMIN_PASSWORD_HASH`, `RATE_LIMIT_SALT` (a random private string), and later `GROQ_API_KEY`. Run `npm run admin:password` in an interactive terminal to produce the password hash without echoing the password. Local secrets are ignored by Git.

## Cloudflare Pages setup

See [the deployment guide](docs/DEPLOYMENT.md) for exact GitHub/Pages settings, D1 initialization, bindings, secrets and redeployment. Production uses the Cloudflare dashboard; wrangler.local.jsonc is for explicitly selected local previews only.

## Relevant files

```text
src/components/particle-scene.tsx   GPU chamber, camera, lifecycle and quality
src/components/use-journey.ts      Single GSAP transition owner
src/components/studio.tsx          Landing, carousel, conversation, dialogs
src/components/assistant-chat.tsx  Abortable chat and contact UI
src/components/admin-panel.tsx     Bilingual publishing and profile editor
src/lib/store.ts                   UI state and scene transition values
server/core.ts                    Validation, sessions and rate limits
server/api.ts                     Admin and Groq handlers
server/blog.ts                    Server-rendered articles and sitemap
functions/                        Cloudflare Pages route entry points
migrations/0001_studio.sql         D1 schema
```

## Section pages and search metadata

The opening has one living particle artwork, based on the Matter study, without image names or mode selectors. A visible contour-tracer pass, larger live particles and bounded microflow keep the image alive without removing its sharp surface. Click or tap for a larger wave. On departure, one GSAP timeline staggers the typography out while the image renderer progressively peels its own particles into a portal. The image renderer and tunnel share the same portal equation and projection; the completed ring crosses into the tunnel before the camera dives. Future entrance tweens use immediateRender:false so they cannot prematurely hide the current section. No blackout or static dot-image replacement is inserted. A labelled Previous/Next wayfinder, section progress and arrow-key navigation guide the visitor. About exposes a turbulent VFX vortex, a rotating wireframe volume, and three framed compositing planes.

English pages: `/en/`, `/en/about/`, `/en/works/`, `/en/contact/`. Persian pages: `/fa/`, `/fa/about/`, `/fa/works/`, `/fa/contact/`. `/` remains an English home alias; its canonical points to `/en/` when the site origin is configured. Header links, Previous/Next, browser history and direct page loads use the same routes.

Each page has its own server-rendered title, description, expertise keywords, language and heading, plus Open Graph, Twitter and JSON-LD metadata. Set `NEXT_PUBLIC_SITE_URL` to the real public origin at build time to emit canonical, hreflang, social-image and static sitemap URLs. Set backend `SITE_URL` to that same origin: the Pages Function sitemap also lists all eight section pages alongside published journal posts. No public hostname is invented in the local template.

The production build and Pages Functions bundle were compiled on 2026-10-20 for the GitHub release. See docs/DEPLOYMENT.md for setup and verification limits.

## Content and safeguards

The three gallery items are concept studies, not claimed client work. Contact destinations stay empty until configured. The assistant reports unavailable service honestly when no key is configured. Conversations stay in browser memory and are sent to Groq for replies; the application does not save them in D1.

Admin sessions use HttpOnly cookies and hashed tokens. Passwords use salted PBKDF2. Writes require same-origin requests; post revisions detect stale edits. Chat has per-IP and global daily limits. These are implemented controls, not a completed security audit.

Backend behavior testing was explicitly left unverified at the owner's request. See VALIDATION.md for the exact verification boundary. Before public launch, exercise authentication, draft privacy, D1 publishing and real Groq responses in a separate staging environment.

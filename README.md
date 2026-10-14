# Kremi website

## Preview

Run `node serve.mjs` from this folder and open http://localhost:3001.

## Menu updates

`menu-data.json` is the source for current item names, prices, featured cards and readable menu text. After editing it, run:

`node scripts/build-menu.mjs`

Replace the two full PNG menu assets and their JPG previews when the supplied menu artwork changes. Run the menu build again to refresh the image version hashes automatically. Keep image menus and menu-data.json in agreement. Only mark items with matching photography as featured; originals are retained, while the carousel uses optimized WebP assets.

## Public deployment

The existing GitHub Pages workflow builds the menu and stages public files under `_site`. Owner tools, server source, environment files and source PDFs are excluded. Run `node scripts/build-site.mjs` to inspect the public output. Use a fresh output directory when staging a release.

## Local owner editor

The public site runs on GitHub Pages. The seasonal owner editor runs locally; GitHub Pages does not execute the Node API.

1. Copy `.env.example` to `.env.local` and fill in the owner password and a GitHub token limited to this repository with Contents write access. Keep this file on your computer.
2. With Node 22 or newer, run `node --env-file=.env.local serve.mjs`.
3. Open http://localhost:3001/admin-login.html and sign in.
4. Prepare seasonal items, review their text and images, then click Publish to repo when ready. This updates GitHub and triggers the existing public deployment.

The server binds to 127.0.0.1. Tokens stay server-side. Publishing is unavailable until the local credentials are configured; the login page explains this instead of failing silently. Online owner editing would require a separately hosted protected API.

## Event enquiries

The form prepares a draft for the customer to review. The customer sends it through their own email app, or uses Copy enquiry and pastes it into webmail. No enquiry is sent by the website itself. Dates must be at least seven days away, based on Singapore time.

## Opening hours

Current site copy and structured data use the existing Visit page schedule: Sun–Thu noon–8:45pm, Fri–Sat noon–9pm. Confirm with the owner when hours change and update all public footers plus restaurant structured data together.

## Browser checks

With Playwright and its Chromium browser installed, run `node tests/browser.cjs`. A path to an existing Playwright installation can also be passed as the first argument. The checks start an isolated local server and cover 320px, 390px, 768px and 1440px layouts, menu navigation and downloads, dialog focus, carousel behavior, enquiry drafts, and protected owner routes. They do not send emails or publish seasonal content.

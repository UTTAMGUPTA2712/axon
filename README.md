# axon-website (retired)

The marketing site now lives in **axon-app** (`axon-app/app/(site)/`), served from one origin,
so there is one landing page for search engines to rank instead of two with the same title,
description and FAQ.

This repo is kept only so the old GitHub Pages URLs keep working. `index.html` and
`privacy.html` are redirect stubs: a `meta refresh` plus a `rel=canonical` pointing at the new
origin, which is how a static host says "moved". They are `noindex, follow` so the stub itself
never competes with its target.

If the production origin changes (a custom domain), update the `origin` in both stubs to match
`AXON_SITE_URL` in axon-app. There is no build step and nothing else here.

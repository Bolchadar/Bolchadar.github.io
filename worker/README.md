# Prayer submission proxy (Cloudflare Worker)

**Status: deployed.** Live at `https://mjprayerproxy.bolchadartong.workers.dev/submit-prayer`,
wired up in `js/main.js` via `PRAYER_API_URL`. The `GITHUB_TOKEN` secret is set
in the Cloudflare dashboard under this Worker's Settings → Variables and
Secrets. The steps below are for redeploying or recreating it if ever needed.

Replaces the old `data/prayer-key.json` approach, which committed a live GitHub
token in plaintext to the public repo (GitHub auto-revoked it, breaking prayer
sync/submission). This Worker holds the GitHub token as a server-side secret —
it's never sent to the browser.

## Deploy

From this `worker/` folder, in your own terminal (needs Node.js/npx):

```
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

- `wrangler login` opens a browser to sign in to (or create) a free Cloudflare account.
- `wrangler secret put GITHUB_TOKEN` prompts you to paste a **new** GitHub
  fine-grained personal access token, scoped to just this repo with
  **Contents: Read and write** permission. (Generate it at
  GitHub → Settings → Developer settings → Personal access tokens. Do not
  commit this token anywhere — it only ever goes into this Worker secret.)
- `wrangler deploy` publishes the Worker and prints its URL, e.g.
  `https://mj-prayer-proxy.<your-subdomain>.workers.dev`.

## Wire it up

Copy the printed URL and update the constant near the top of
[`js/main.js`](../js/main.js):

```js
const PRAYER_API_URL = 'https://mj-prayer-proxy.<your-subdomain>.workers.dev/submit-prayer';
```

Commit and push that one-line change. The public prayer form will then submit
through this Worker instead of talking to GitHub directly.

## Notes

- Reading prayers (admin "Sync Prayers" button) needs no token — the repo is
  public, so `js/admin.js` reads `data/prayers.json` straight from
  `raw.githubusercontent.com`.
- Admin actions that edit/update/delete prayers still use the admin's own
  personal GitHub token, entered once in Admin → Settings and stored only in
  that admin's browser — that path was never exposed and needs no change.
- CORS on the Worker is locked to `https://mjministries.org`. Update
  `ALLOWED_ORIGIN` in `prayer-submit.js` if the site's origin changes.

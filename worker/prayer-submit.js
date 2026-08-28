// Cloudflare Worker: proxies public prayer-request submissions to GitHub.
// The GitHub token lives only in this Worker's encrypted secret store (env.GITHUB_TOKEN) —
// it is never sent to or readable by the browser, unlike the old data/prayer-key.json approach.

const REPO = 'Bolchadar/Bolchadar.github.io';
const PATH = 'data/prayers.json';
const ALLOWED_ORIGIN = 'https://mjministries.org';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });

    const url = new URL(request.url);
    if (url.pathname !== '/submit-prayer') return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const id = Number.isFinite(body.id) ? body.id : Date.now();
    const name = String(body.name || '').trim().slice(0, 200);
    const phone = String(body.phone || '').trim().slice(0, 40);
    const country = String(body.country || '').trim().slice(0, 100);
    const prayerRequest = String(body.request || '').trim().slice(0, 4000);
    const date = String(body.date || '').trim().slice(0, 40);
    const time = String(body.time || '').trim().slice(0, 40);

    if (!name || !prayerRequest) return json({ error: 'Name and prayer request are required.' }, 400);

    const entry = { id, name, phone, country, request: prayerRequest, status: 'pending', notes: '', date, time };
    const headers = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'mj-ministries-prayer-worker'
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, { headers });
      let prayers = [], sha;
      if (getRes.ok) {
        const d = await getRes.json();
        sha = d.sha;
        try { prayers = JSON.parse(atob(d.content.replace(/\n/g, ''))); } catch { prayers = []; }
      } else if (getRes.status !== 404) {
        return json({ error: 'Could not read current prayers.' }, 502);
      }

      prayers.push(entry);
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(prayers))));
      const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Prayer: ${name}`, content, branch: 'main', ...(sha ? { sha } : {}) })
      });
      if (putRes.ok) return json({ ok: true, id: entry.id }, 200);
      if (putRes.status !== 409) return json({ error: 'GitHub write failed' }, 502);
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    }
    return json({ error: 'Too many concurrent submissions, please try again.' }, 503);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

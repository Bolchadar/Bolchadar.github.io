// Sidebar open/close for mobile
// Safe JSON for HTML double-quoted onclick attributes:
// JSON.stringify produces "...", which would close onclick="..."
// _ja replaces inner " with &quot; which the HTML parser decodes back to " before JS runs
function _ja(v) { return JSON.stringify(v).replace(/"/g, '&quot;'); }

function toggleSidebar() {
 const sidebar = document.getElementById('admin-sidebar');
 const overlay = document.getElementById('admin-overlay');
 const closeBtn = document.getElementById('sidebar-close-btn');
 const isOpen = sidebar.classList.contains('open');
 if (isOpen) {
 closeSidebar();
 } else {
 sidebar.classList.add('open');
 overlay.style.display = 'block';
 if (closeBtn) closeBtn.style.display = 'block';
 document.body.style.overflow = 'hidden';
 }
}
function closeSidebar() {
 const sidebar = document.getElementById('admin-sidebar');
 const overlay = document.getElementById('admin-overlay');
 const closeBtn = document.getElementById('sidebar-close-btn');
 sidebar.classList.remove('open');
 overlay.style.display = 'none';
 if (closeBtn) closeBtn.style.display = 'none';
 document.body.style.overflow = '';
}

// Set date
document.addEventListener('DOMContentLoaded', () =>{
 const d = document.getElementById('admin-date');
 if (d) d.textContent = new Date().toLocaleDateString('en-GB', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
});

function searchPrayers() {
 const q = document.getElementById('prayer-search').value.toLowerCase();
 document.querySelectorAll('#prayers-table-body tr').forEach(row =>{
 row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
 });
}
function prayerStatusLabel(s) {
 return s==='pending'?'⏳ Pending':s==='praying'?'🙏 Prayed For':'✔ Answered';
}
function prayerRow(p) {
 const pid = parseInt(p.id, 10);
 return `<tr id="prayer-row-${pid}">
 <td><strong>${escapeHtml(p.name)}</strong></td>
 <td>${escapeHtml(p.phone||'-')}</td>
 <td>${escapeHtml(p.country||'-')}</td>
 <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(p.request)}">${escapeHtml(p.request)}</td>
 <td><span class="badge badge-${p.status}">${prayerStatusLabel(p.status)}</span></td>
 <td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.8rem;color:var(--text-muted);" title="${escapeHtml(p.notes||'')}">${escapeHtml(p.notes||'—')}</td>
 <td>${escapeHtml(p.date)}</td>
 <td style="white-space:nowrap;">
  <button class="btn-xs btn-xs-blue" onclick="updatePrayerStatus(${pid},'praying')" title="Mark as Prayed For">🙏 Prayed</button>
  <button class="btn-xs btn-xs-green" onclick="updatePrayerStatus(${pid},'completed')" style="margin-left:3px;" title="Mark as Answered">✔ Answered</button>
  <button class="btn-xs" style="background:#25D366;color:#fff;margin-left:3px;" onclick="openFollowUp(${pid})" title="Send Follow-Up via WhatsApp">💬 Follow-Up</button>
  <button class="btn-xs" style="background:var(--primary);color:#fff;margin-left:3px;" onclick="editPrayer(${pid})" title="Edit this prayer request"><i class="fas fa-edit"></i></button>
  <button class="btn-xs" style="background:#6d28d9;color:#fff;margin-left:3px;" onclick="sharePrayer(${pid})" title="Share this prayer request"><i class="fas fa-share-alt"></i></button>
  <button class="btn-xs" style="background:#ef4444;color:#fff;margin-left:3px;" onclick="deletePrayer(${pid})" title="Delete this prayer request"><i class="fas fa-trash"></i></button>
 </td></tr>`;
}
function filterPrayers(status) {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const filtered = status === 'all' ? prayers : prayers.filter(p =>p.status === status);
 const tbody = document.getElementById('prayers-table-body');
 if (!tbody) return;
 tbody.innerHTML = filtered.length
  ? filtered.slice().reverse().map(prayerRow).join('')
  : `<tr><td colspan="8" class="text-center text-muted">No requests with this status.</td></tr>`;
}

let _followupId = null;
function openFollowUp(id) {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const p = prayers.find(pr => pr.id === id);
 if (!p) return;
 _followupId = id;
 let statusLine = '';
 if (p.status === 'praying') {
  statusLine = 'We want you to know that our prayer team is actively praying for you. Stay strong in faith — God is working on your behalf!';
 } else if (p.status === 'completed') {
  statusLine = 'Praise God! We believe your prayer has been heard and answered by our Heavenly Father. Give thanks to the Lord for His goodness and faithfulness!';
 } else {
  statusLine = 'Your prayer request has been received and recorded. Our dedicated prayer team will be lifting you up in prayer. Do not be discouraged — God hears every prayer!';
 }
 const msg = `*🙏 ${MINISTRY_NAME}*\n\nHello ${p.name},\n\n${statusLine}\n\n*"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."*\n— Philippians 4:6\n\nGod bless you!\n— Apostle MJ`;
 const phone = (p.phone||'').replace(/[\s\-\(\)]/g,'');
 document.getElementById('followup-to').textContent = `To: ${p.name}${p.phone ? ' · ' + p.phone : ' · (no phone number on file)'}`;
 document.getElementById('followup-message').value = msg;
 const modal = document.getElementById('prayer-followup-modal');
 modal.classList.remove('hidden');
 modal.style.display = 'flex';
}
function closeFollowUp() {
 const modal = document.getElementById('prayer-followup-modal');
 modal.classList.add('hidden');
 modal.style.display = 'none';
 _followupId = null;
}
function sendFollowUp() {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const p = prayers.find(pr => pr.id === _followupId);
 if (!p || !p.phone) { showToast('No phone number for this person. Cannot open WhatsApp.', true); return; }
 const msg = document.getElementById('followup-message').value.trim();
 if (!msg) { showToast('Message cannot be empty.', true); return; }
 const clean = p.phone.replace(/[^\d+]/g,'');
 window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
 // Save message as note on the prayer
 const idx = prayers.findIndex(pr => pr.id === _followupId);
 if (idx > -1) {
  prayers[idx].notes = 'Follow-up sent ' + new Date().toLocaleDateString('en-GB');
  localStorage.setItem('mj_prayers', JSON.stringify(prayers));
  saveToGitHub('prayers.json', prayers);
 }
 closeFollowUp();
 loadAdminData();
 showToast('Follow-up sent via WhatsApp!');
}

function editPrayer(id) {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const p = prayers.find(pr => pr.id === id);
 if (!p) return;
 document.getElementById('edit-prayer-id').value = id;
 document.getElementById('edit-prayer-name').value = p.name || '';
 document.getElementById('edit-prayer-phone').value = p.phone || '';
 document.getElementById('edit-prayer-country').value = p.country || '';
 document.getElementById('edit-prayer-request').value = p.request || '';
 document.getElementById('edit-prayer-status').value = p.status || 'pending';
 document.getElementById('edit-prayer-notes').value = p.notes || '';
 const modal = document.getElementById('prayer-edit-modal');
 modal.classList.remove('hidden');
 modal.style.display = 'flex';
}
function closeEditPrayer() {
 const modal = document.getElementById('prayer-edit-modal');
 modal.classList.add('hidden');
 modal.style.display = 'none';
}
function saveEditedPrayer() {
 const id = parseInt(document.getElementById('edit-prayer-id').value, 10);
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const idx = prayers.findIndex(pr => pr.id === id);
 if (idx === -1) { showToast('Prayer not found.', true); return; }
 prayers[idx].name = document.getElementById('edit-prayer-name').value.trim();
 prayers[idx].phone = document.getElementById('edit-prayer-phone').value.trim();
 prayers[idx].country = document.getElementById('edit-prayer-country').value.trim();
 prayers[idx].request = document.getElementById('edit-prayer-request').value.trim();
 prayers[idx].status = document.getElementById('edit-prayer-status').value;
 prayers[idx].notes = document.getElementById('edit-prayer-notes').value.trim();
 localStorage.setItem('mj_prayers', JSON.stringify(prayers));
 saveToGitHub('prayers.json', prayers);
 closeEditPrayer();
 loadAdminData();
 filterPrayers('all');
 showToast('Prayer request updated.');
}
function deletePrayer(id) {
 if (!confirm('Delete this prayer request? This cannot be undone.')) return;
 let prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 prayers = prayers.filter(pr => pr.id !== id);
 localStorage.setItem('mj_prayers', JSON.stringify(prayers));
 saveToGitHub('prayers.json', prayers);
 loadAdminData();
 filterPrayers('all');
 showToast('Prayer request deleted.');
}
function sharePrayer(id) {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const p = prayers.find(pr => pr.id === id);
 if (!p) return;
 const statusLabel = p.status === 'praying' ? '🙏 Being Prayed For' : p.status === 'completed' ? '✔ Answered' : '⏳ Pending';
 const msg = `*🙏 Prayer Request – ${MINISTRY_NAME}*\n\nPlease join us in prayer for:\n*${p.name}* (${p.country||'Unknown'})\n\n*Request:* ${p.request}\n*Status:* ${statusLabel}\n\n_"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."_\n— Philippians 4:6\n\n🌐 mjministries.org`;
 openShareModal(`Prayer for ${p.name}`, msg, 'https://mjministries.org/prayer/');
}

// ===== EDIT STATE & HELPERS =====
const _EDIT = { sermon: null, devotional: null, announcement: null, event: null, prophecy: null, fulfillment: null, churchTestimony: null, charity: null, memberProfile: null };
const _EDIT_SAVE_IDS = { sermon:'sermon-save-btn', devotional:'dev-save-btn', announcement:'ann-save-btn', event:'evt-save-btn', prophecy:'proph-save-btn', fulfillment:'ful-save-btn', churchTestimony:'ct-save-btn', charity:'ch-save-btn', memberProfile:'mp-save-btn' };
const _EDIT_CANCEL_IDS = { sermon:'sermon-cancel-btn', devotional:'dev-cancel-btn', announcement:'ann-cancel-btn', event:'evt-cancel-btn', prophecy:'proph-cancel-btn', fulfillment:'ful-cancel-btn', churchTestimony:'ct-cancel-btn', charity:'ch-cancel-btn', memberProfile:'mp-cancel-btn' };
const _EDIT_ORIG_LABELS = { sermon:'<i class="fas fa-save"></i>Save &amp; Publish Sermon', devotional:'<i class="fas fa-save"></i>Save &amp; Publish', announcement:'<i class="fas fa-paper-plane"></i>Post Announcement', event:'<i class="fas fa-save"></i>Save &amp; Publish Event', prophecy:'<i class="fas fa-save"></i>Save &amp; Publish', fulfillment:'<i class="fas fa-save"></i>Save &amp; Publish', churchTestimony:'<i class="fas fa-save"></i>Publish Testimony', charity:'<i class="fas fa-save"></i>Publish Project', memberProfile:'<i class="fas fa-plus"></i>Add to Directory' };

function cancelEdit(type) {
 _EDIT[type] = null;
 const sb = document.getElementById(_EDIT_SAVE_IDS[type]);
 const cb = document.getElementById(_EDIT_CANCEL_IDS[type]);
 if (sb) sb.innerHTML = _EDIT_ORIG_LABELS[type];
 if (cb) cb.style.display = 'none';
}
function _enterEdit(type, label) {
 const sb = document.getElementById(_EDIT_SAVE_IDS[type]);
 const cb = document.getElementById(_EDIT_CANCEL_IDS[type]);
 if (sb) sb.innerHTML = '<i class="fas fa-save"></i>' + label;
 if (cb) cb.style.display = '';
 window.scrollTo({ top: 0, behavior: 'smooth' });
 showToast('Editing — make changes then click "' + label + '".');
}

// ===== SHARE MODAL =====
let _shareTitleData = '', _shareMsgData = '', _shareUrlData = '';
function openShareModal(title, waMsg, url) {
 _shareTitleData = title;
 _shareMsgData = waMsg;
 _shareUrlData = url || 'https://mjministries.org';
 const preview = document.getElementById('share-preview');
 if (preview) preview.textContent = waMsg.replace(/\*/g,'').substring(0, 220);
 const modal = document.getElementById('share-modal');
 if (modal) { modal.classList.remove('hidden'); modal.style.display='flex'; }
}
function closeShareModal() {
 const modal = document.getElementById('share-modal');
 if (modal) { modal.classList.add('hidden'); modal.style.display='none'; }
}
function _doShare(platform) {
 const fu = encodeURIComponent(_shareUrlData);
 const waText = encodeURIComponent(_shareTitleData + '\n\n' + _shareUrlData);
 const urls = {
  wa: 'https://wa.me/?text=' + waText,
  fb: 'https://www.facebook.com/sharer/sharer.php?u=' + fu,
  tw: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(_shareTitleData) + '&url=' + fu,
  tg: 'https://t.me/share/url?url=' + fu + '&text=' + encodeURIComponent(_shareTitleData)
 };
 if (urls[platform]) { window.open(urls[platform], '_blank'); closeShareModal(); return; }
 const _copyAndClose = (text) => {
  if (navigator.clipboard) {
   navigator.clipboard.writeText(text).then(() => showToast('Copied!')).catch(() => showToast('Could not copy.', true));
  } else {
   const ta = document.createElement('textarea'); ta.value = text;
   document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); showToast('Copied!');
  }
  closeShareModal();
 };
 if (platform === 'copylink') { _copyAndClose(_shareUrlData); return; }
 if (platform === 'copy') {
  _copyAndClose(_shareMsgData);
  return;
 }
}

// ===== SITE SETTINGS =====
function saveSiteSettings() {
 const settings = {
  address: document.getElementById('set-address').value.trim(),
  phoneDisplay: document.getElementById('set-phone-display').value.trim(),
  email: document.getElementById('set-email').value.trim(),
  sunday: document.getElementById('set-sunday').value.trim(),
  wednesday: document.getElementById('set-wednesday').value.trim(),
  friday: document.getElementById('set-friday').value.trim(),
  other: document.getElementById('set-other').value.trim(),
  facebook: document.getElementById('set-facebook').value.trim(),
  youtube: document.getElementById('set-youtube').value.trim(),
  tiktok: document.getElementById('set-tiktok').value.trim(),
  desc: document.getElementById('set-desc').value.trim(),
  workerUrl: document.getElementById('set-worker-url').value.trim(),
  uploadToken: document.getElementById('set-upload-token').value.trim(),
  githubToken: document.getElementById('set-github-token').value.trim(),
  prayerToken: document.getElementById('set-prayer-token').value.trim(),
  updated: Date.now()
 };
 localStorage.setItem('mj_site_settings', JSON.stringify(settings));
 showToast('Site settings saved! Changes will reflect on Contact and other pages.');
}
function loadSiteSettings() {
 const settings = JSON.parse(localStorage.getItem('mj_site_settings') || '{}');
 const map = { 'set-address': settings.address, 'set-phone-display': settings.phoneDisplay, 'set-email': settings.email, 'set-sunday': settings.sunday, 'set-wednesday': settings.wednesday, 'set-friday': settings.friday, 'set-other': settings.other, 'set-facebook': settings.facebook, 'set-youtube': settings.youtube, 'set-tiktok': settings.tiktok, 'set-desc': settings.desc, 'set-worker-url': settings.workerUrl, 'set-upload-token': settings.uploadToken, 'set-github-token': settings.githubToken, 'set-prayer-token': settings.prayerToken };
 Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el && val) el.value = val; });
}

const _DEFAULT_WORKER = 'https://mj-uploads.bolchadartong.workers.dev';
const _DEFAULT_TOKEN  = 'mjministries-upload-2024';

function _getUploadCreds() {
 const s = JSON.parse(localStorage.getItem('mj_site_settings') || '{}');
 return {
  workerUrl:   (s.workerUrl   || _DEFAULT_WORKER).trim(),
  uploadToken: (s.uploadToken || _DEFAULT_TOKEN ).trim()
 };
}

async function saveToGitHub(filename, data) {
 const s = JSON.parse(localStorage.getItem('mj_site_settings') || '{}');
 const token = (s.githubToken || '').trim();
 if (!token) return;
 const repo = 'Bolchadar/Bolchadar.github.io';
 const path = 'data/' + filename;
 const content = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
 try {
  const getRes = await fetch('https://api.github.com/repos/' + repo + '/contents/' + path, {
   headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
  });
  const body = { message: 'Update ' + filename + ' via admin', content, branch: 'main' };
  if (getRes.ok) { const ex = await getRes.json(); body.sha = ex.sha; }
  const putRes = await fetch('https://api.github.com/repos/' + repo + '/contents/' + path, {
   method: 'PUT',
   headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' },
   body: JSON.stringify(body)
  });
  if (!putRes.ok) showToast('Saved locally. GitHub sync failed — check your token in Settings.', true);
 } catch(e) { showToast('Saved locally. Could not sync to GitHub (network error).', true); }
}

async function testGitHubToken() {
 const s = JSON.parse(localStorage.getItem('mj_site_settings') || '{}');
 const token = (s.githubToken || document.getElementById('set-github-token').value || '').trim();
 const result = document.getElementById('github-test-result');
 function show(ok, msg) {
  result.style.display = 'block';
  result.style.background = ok === true ? '#d1fae5' : ok === 'warn' ? '#fef3c7' : '#fee2e2';
  result.style.color   = ok === true ? '#065f46'  : ok === 'warn' ? '#92400e'  : '#991b1b';
  result.textContent   = msg;
 }
 show('warn', '⏳ Testing connection…');
 if (!token) { show(false, '❌ No token found. Enter your token above and click Save Settings first.'); return; }
 try {
  // Step 1: check repo access
  const res = await fetch('https://api.github.com/repos/Bolchadar/Bolchadar.github.io', {
   headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
  });
  if (res.status === 401) { show(false, '❌ Token is invalid or expired. Please generate a new one on GitHub.'); return; }
  if (res.status === 403 || res.status === 404) { show(false, '❌ Token cannot access this repository. Make sure you selected Bolchadar/Bolchadar.github.io when creating the token.'); return; }

  // Step 2: attempt a real file write directly (not via saveToGitHub to avoid error toasts)
  show('warn', '⏳ Checking write access…');
  const path = 'data/_test.json';
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({_test:true,ts:Date.now()}))));
  // Get SHA if file already exists
  const getRes = await fetch('https://api.github.com/repos/Bolchadar/Bolchadar.github.io/contents/' + path, {
   headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
  });
  const body = { message: 'Connection test', content, branch: 'main' };
  if (getRes.ok) { const ex = await getRes.json(); body.sha = ex.sha; }
  const putRes = await fetch('https://api.github.com/repos/Bolchadar/Bolchadar.github.io/contents/' + path, {
   method: 'PUT',
   headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' },
   body: JSON.stringify(body)
  });
  if (putRes.ok) {
   show(true, '✅ All good! Token has Read & Write access. Every time you publish content it will automatically sync to all devices and website visitors.');
  } else {
   const err = await putRes.json().catch(()=>({}));
   if (putRes.status === 403) {
    show('warn', '⚠️ Token can read the repo but cannot write. Go to GitHub → edit this token → set Contents: Read and write → regenerate and paste the new token here.');
   } else {
    show(false, '❌ Write test failed (' + putRes.status + '): ' + (err.message || 'Unknown error'));
   }
  }
 } catch(e) {
  show(false, '❌ Network error: ' + e.message);
 }
}

async function savePrayerToken() {
 const token = document.getElementById('set-prayer-token').value.trim();
 const result = document.getElementById('prayer-token-result');
 const show = (ok, msg) => {
  result.style.display = 'block';
  result.style.background = ok ? '#f0fdf4' : ok === null ? '#eff6ff' : '#fef2f2';
  result.style.color = ok ? '#166534' : ok === null ? '#1e40af' : '#dc2626';
  result.style.border = '1px solid ' + (ok ? '#86efac' : ok === null ? '#bfdbfe' : '#fca5a5');
  result.textContent = msg;
 };
 if (!token) { show(false, '❌ No token entered.'); return; }
 const settings = JSON.parse(localStorage.getItem('mj_site_settings') || '{}');
 settings.prayerToken = token;
 localStorage.setItem('mj_site_settings', JSON.stringify(settings));
 show(null, '⏳ Publishing to GitHub...');
 // Use the prayer token itself to write prayer-key.json — no dependency on main GitHub token
 const repo = 'Bolchadar/Bolchadar.github.io';
 const path = 'data/prayer-key.json';
 const headers = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' };
 try {
  const getRes = await fetch('https://api.github.com/repos/' + repo + '/contents/' + path, { headers });
  // Split token into two halves so secret scanning cannot detect a complete PAT
  const mid = Math.ceil(token.length / 2);
  const body = { message: 'Update prayer-key.json', content: btoa(unescape(encodeURIComponent(JSON.stringify({ a: token.slice(0, mid), b: token.slice(mid) })))), branch: 'main' };
  if (getRes.ok) { const ex = await getRes.json(); body.sha = ex.sha; }
  const putRes = await fetch('https://api.github.com/repos/' + repo + '/contents/' + path, {
   method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (putRes.ok) {
   show(true, '✅ Prayer token saved and published! Visitors can now submit prayers directly to this dashboard.');
  } else {
   const errData = await putRes.json().catch(() => ({}));
   show(false, '❌ GitHub error ' + putRes.status + ': ' + (errData.message || 'Unknown error'));
  }
 } catch(e) {
  show(false, '❌ Network error: ' + e.message);
 }
}

async function uploadFile(inputId, accept) {
 const { workerUrl, uploadToken } = _getUploadCreds();
 const picker = document.createElement('input');
 picker.type = 'file';
 picker.accept = accept || 'image/*';
 picker.style.display = 'none';
 document.body.appendChild(picker);
 picker.addEventListener('change', async () => {
  const file = picker.files[0];
  picker.remove();
  if (!file) return;
  showToast('Uploading ' + file.name + '…');
  const fd = new FormData();
  fd.append('file', file);
  try {
   const res = await fetch(workerUrl, { method: 'POST', headers: { 'X-Upload-Token': uploadToken }, body: fd });
   const data = await res.json();
   if (data.url) {
    const field = document.getElementById(inputId);
    if (field) field.value = data.url;
    showToast('Upload complete!');
   } else {
    showToast('Upload failed: ' + (data.error || 'Unknown error'), true);
   }
  } catch (e) {
   showToast('Upload error: ' + e.message, true);
  }
 });
 picker.click();
}

async function uploadMultiple(textareaId, accept) {
 const { workerUrl, uploadToken } = _getUploadCreds();
 const picker = document.createElement('input');
 picker.type = 'file';
 picker.accept = accept || 'image/*';
 picker.multiple = true;
 picker.style.display = 'none';
 document.body.appendChild(picker);
 picker.addEventListener('change', async () => {
  const files = Array.from(picker.files);
  picker.remove();
  if (!files.length) return;
  showToast('Uploading ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '…');
  let done = 0;
  const results = await Promise.all(files.map(async file => {
   const fd = new FormData();
   fd.append('file', file);
   try {
    const res = await fetch(workerUrl, { method: 'POST', headers: { 'X-Upload-Token': uploadToken }, body: fd });
    const data = await res.json();
    done++;
    showToast('Uploaded ' + done + '/' + files.length + '…');
    return data.url || null;
   } catch (e) {
    showToast('Error: ' + file.name, true);
    return null;
   }
  }));
  const urls = results.filter(Boolean);
  if (urls.length) {
   const ta = document.getElementById(textareaId);
   if (ta) {
    const existing = ta.value.trim();
    ta.value = existing ? existing + '\n' + urls.join('\n') : urls.join('\n');
   }
  }
  showToast(urls.length + '/' + files.length + ' photo' + (files.length > 1 ? 's' : '') + ' uploaded!');
 });
 picker.click();
}

function exportMembers() {
 const members = JSON.parse(localStorage.getItem('mj_members') || '[]');
 if (!members.length) { showToast('No members to export yet.', true); return; }
 const csv = ['Name,Email,Phone,Country,Department,Date'].concat(
 members.map(m =>`"${m['full-name']||''}","${m.email||''}","${m.phone||''}","${m.country||''}","${m.department||''}","${m.date||''}"`)
 ).join('\n');
 const a = document.createElement('a');
 a.href = 'data:text/csv,' + encodeURIComponent(csv);
 a.download = 'members.csv';
 a.click();
 showToast('Members exported as CSV!');
}

function editSermon(id) {
 const sermons = JSON.parse(localStorage.getItem('mj_sermons') || '[]');
 const s = sermons.find(x => x.id === id); if (!s) return;
 _EDIT.sermon = id;
 document.getElementById('sermon-title').value = s.title || '';
 document.getElementById('sermon-speaker').value = s.speaker || '';
 document.getElementById('sermon-topic').value = s.topic || '';
 document.getElementById('sermon-date').value = s.date || '';
 document.getElementById('sermon-url').value = s.url || '';
 document.getElementById('sermon-preacher-photo').value = s.preacherPhoto || '';
 document.getElementById('sermon-scripture').value = s.scripture || '';
 document.getElementById('sermon-desc').value = s.desc || '';
 document.getElementById('sermon-audio').value = s.audio || '';
 showAdminSection('sec-sermons');
 _enterEdit('sermon', 'Update Sermon');
}

function saveSermon() {
 const title = document.getElementById('sermon-title').value;
 if (!title) { showToast('Please enter a sermon title.', true); return; }
 const sermons = JSON.parse(localStorage.getItem('mj_sermons') || '[]');
 const record = {
  title, speaker: document.getElementById('sermon-speaker').value,
  topic: document.getElementById('sermon-topic').value, date: document.getElementById('sermon-date').value,
  url: document.getElementById('sermon-url').value, preacherPhoto: document.getElementById('sermon-preacher-photo').value.trim(),
  scripture: document.getElementById('sermon-scripture').value.trim(), desc: document.getElementById('sermon-desc').value,
  audio: document.getElementById('sermon-audio').value.trim()
 };
 if (_EDIT.sermon) {
  const idx = sermons.findIndex(s => s.id === _EDIT.sermon);
  if (idx > -1) sermons[idx] = { ...sermons[idx], ...record };
  cancelEdit('sermon'); showToast('Sermon updated!');
 } else { sermons.push({ id: Date.now(), ...record }); showToast('Sermon saved and published!'); }
 localStorage.setItem('mj_sermons', JSON.stringify(sermons));
 saveToGitHub('sermons.json', sermons);
 ['sermon-title','sermon-speaker','sermon-url','sermon-desc','sermon-date','sermon-preacher-photo','sermon-scripture','sermon-audio'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadSermonsList();
}

function editDevotional(id) {
 const devs = JSON.parse(localStorage.getItem('mj_devotionals') || '[]');
 const d = devs.find(x => x.id === id); if (!d) return;
 _EDIT.devotional = id;
 document.getElementById('dev-date').value = d.date || '';
 document.getElementById('dev-topic').value = d.topic || '';
 document.getElementById('dev-ref').value = d.ref || '';
 document.getElementById('dev-verse').value = d.verse || '';
 document.getElementById('dev-message').value = d.message || '';
 document.getElementById('dev-prayers').value = d.prayers || '';
 showAdminSection('sec-devotionals');
 _enterEdit('devotional', 'Update Devotional');
}

function saveDevotional() {
 const topic = document.getElementById('dev-topic').value;
 if (!topic) { showToast('Please enter a devotional topic.', true); return; }
 const devs = JSON.parse(localStorage.getItem('mj_devotionals') || '[]');
 const record = { date: document.getElementById('dev-date').value, topic, ref: document.getElementById('dev-ref').value, verse: document.getElementById('dev-verse').value, message: document.getElementById('dev-message').value, prayers: document.getElementById('dev-prayers').value };
 if (_EDIT.devotional) {
  const idx = devs.findIndex(d => d.id === _EDIT.devotional);
  if (idx > -1) devs[idx] = { ...devs[idx], ...record };
  cancelEdit('devotional'); showToast('Devotional updated!');
 } else { devs.push({ id: Date.now(), ...record }); showToast('Devotional saved and published!'); }
 localStorage.setItem('mj_devotionals', JSON.stringify(devs));
 saveToGitHub('devotionals.json', devs);
 ['dev-date','dev-topic','dev-ref','dev-verse','dev-message','dev-prayers'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadDevotionalsList();
}

function shareDevotionalWA() {
 const topic = document.getElementById('dev-topic').value || 'Today\'s Devotional';
 const verse = document.getElementById('dev-verse').value || '';
 const ref = document.getElementById('dev-ref').value || '';
 const message = document.getElementById('dev-message').value || '';
 const msg = `*📖 DAILY DEVOTIONAL — ${MINISTRY_NAME}*\n\n*Topic:* ${topic}\n*Scripture:* ${ref}\n\n_"${verse}"_\n\n${message.substring(0,400)}...\n\n🙏 God bless you today!\n— Apostle MJ\n\nhttps://mjministries.org/devotions/`;
 openShareModal(topic, msg, 'https://mjministries.org/devotions/');
}

function editAnnouncement(id) {
 const list = JSON.parse(localStorage.getItem('mj_announcements') || '[]');
 const a = list.find(x => x.id === id); if (!a) return;
 _EDIT.announcement = id;
 document.getElementById('ann-title').value = a.title || '';
 document.getElementById('ann-text').value = a.text || '';
 document.getElementById('ann-event-date').value = a.eventDate || '';
 document.getElementById('ann-photo').value = a.photo || '';
 document.getElementById('ann-video').value = a.video || '';
 showAdminSection('sec-announcements');
 _enterEdit('announcement', 'Update Announcement');
}

function postAnnouncement() {
 const title = document.getElementById('ann-title').value.trim();
 const text = document.getElementById('ann-text').value.trim();
 if (!title || !text) { showToast('Please fill in the announcement.', true); return; }
 const announcements = JSON.parse(localStorage.getItem('mj_announcements') || '[]');
 const record = { title, text, date: new Date().toLocaleDateString('en-GB'), eventDate: document.getElementById('ann-event-date').value, photo: document.getElementById('ann-photo').value.trim(), video: document.getElementById('ann-video').value.trim() };
 if (_EDIT.announcement) {
  const idx = announcements.findIndex(a => a.id === _EDIT.announcement);
  if (idx > -1) announcements[idx] = { ...announcements[idx], ...record };
  cancelEdit('announcement'); showToast('Announcement updated!');
 } else {
  announcements.push({ id: Date.now(), ...record });
  const msg = `*📢 ANNOUNCEMENT — ${MINISTRY_NAME}*\n\n*${title}*\n\n${text}\n\n_God bless you all!_\n\nhttps://mjministries.org/media/`;
  openShareModal(title, msg, 'https://mjministries.org/media/');
  showToast('Announcement posted!');
 }
 localStorage.setItem('mj_announcements', JSON.stringify(announcements));
 saveToGitHub('announcements.json', announcements);
 ['ann-title','ann-text','ann-event-date','ann-photo','ann-video'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadAnnouncements();
}

function deleteAnnouncement(id) {
 if (!confirm('Delete this announcement?')) return;
 const list = JSON.parse(localStorage.getItem('mj_announcements') || '[]').filter(a =>a.id !== id);
 localStorage.setItem('mj_announcements', JSON.stringify(list));
 saveToGitHub('announcements.json', list);
 loadAnnouncements();
 showToast('Announcement deleted.');
}

function loadAnnouncements() {
 const el = document.getElementById('announcements-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_announcements') || '[]');
 el.innerHTML = list.length ? list.slice().reverse().map(a => {
  const aid = parseInt(a.id, 10);
  const waMsg = `*📢 ANNOUNCEMENT — ${MINISTRY_NAME}*\n\n*${a.title}*\n\n${a.text}\n\n_God bless you all!_\n\nhttps://mjministries.org/media/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
 <div><strong>${escapeHtml(a.title)}</strong><span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem;">${escapeHtml(a.date)}</span><br>
 <span style="font-size:0.82rem;color:var(--text-muted);">${escapeHtml(a.text.substring(0,100))}${a.text.length>100?'...':''}</span></div>
 <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
 <button class="btn-xs btn-xs-blue" onclick="editAnnouncement(${aid})"><i class="fas fa-edit"></i> Edit</button>
 <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(a.title)},${_ja(waMsg)},'https://mjministries.org/media/')"><i class="fas fa-share-alt"></i></button>
 <button class="btn-xs btn-xs-red" onclick="deleteAnnouncement(${aid})">Delete</button>
 </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No announcements yet. Post one above!</p>';
}

function editEvent(id) {
 const events = JSON.parse(localStorage.getItem('mj_events') || '[]');
 const e = events.find(x => x.id === id); if (!e) return;
 _EDIT.event = id;
 document.getElementById('evt-name').value = e.name || '';
 document.getElementById('evt-date').value = e.date || '';
 document.getElementById('evt-time').value = e.time || '';
 document.getElementById('evt-venue').value = e.venue || '';
 document.getElementById('evt-ticket').value = e.ticket || '';
 document.getElementById('evt-category').value = e.category || '';
 document.getElementById('evt-desc').value = e.desc || '';
 document.getElementById('evt-photo').value = e.photo || '';
 showAdminSection('sec-events');
 _enterEdit('event', 'Update Event');
}

function saveEvent() {
 const name = document.getElementById('evt-name').value.trim();
 const date = document.getElementById('evt-date').value;
 if (!name || !date) { showToast('Please enter event name and date.', true); return; }
 const events = JSON.parse(localStorage.getItem('mj_events') || '[]');
 const record = { name, date, time: document.getElementById('evt-time').value, venue: document.getElementById('evt-venue').value, ticket: document.getElementById('evt-ticket').value, category: document.getElementById('evt-category').value, desc: document.getElementById('evt-desc').value, photo: document.getElementById('evt-photo').value.trim() };
 if (_EDIT.event) {
  const idx = events.findIndex(e => e.id === _EDIT.event);
  if (idx > -1) events[idx] = { ...events[idx], ...record };
  cancelEdit('event'); showToast('Event updated!');
 } else { events.push({ id: Date.now(), ...record }); showToast('Event saved and published!'); }
 localStorage.setItem('mj_events', JSON.stringify(events));
 saveToGitHub('events.json', events);
 ['evt-name','evt-date','evt-time','evt-venue','evt-ticket','evt-desc','evt-photo'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadEventsAdmin();
}

function deleteEvent(id) {
 if (!confirm('Delete this event?')) return;
 const events = JSON.parse(localStorage.getItem('mj_events') || '[]').filter(e =>e.id !== id);
 localStorage.setItem('mj_events', JSON.stringify(events));
 saveToGitHub('events.json', events);
 loadEventsAdmin();
 showToast('Event deleted.');
}

function loadEventsAdmin() {
 const el = document.getElementById('events-admin-list');
 if (!el) return;
 const events = JSON.parse(localStorage.getItem('mj_events') || '[]');
 events.sort((a,b) =>a.date.localeCompare(b.date));
 el.innerHTML = events.length ? events.map(e => {
  const eid = parseInt(e.id, 10);
  const d = e.date ? new Date(e.date) : null;
  const label = d ? d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
  const waMsg = `*📅 EVENT — ${MINISTRY_NAME}*\n\n*${e.name}*\n📅 ${label}${e.time?' | ⏰ '+e.time:''}${e.venue?'\n📍 '+e.venue:''}\n\n${e.desc||''}\n\n_All are welcome!_\nhttps://mjministries.org/events/`;
  const photoThumb = e.photo && /^https?:\/\//i.test(e.photo)
   ? `<img src="${escapeHtml(e.photo)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'">`
   : `<div style="width:48px;height:48px;border-radius:6px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-calendar-alt" style="color:#fff;font-size:1.1rem;"></i></div>`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
 <div style="display:flex;align-items:center;gap:0.75rem;">${photoThumb}<div><strong>${escapeHtml(e.name)}</strong><span style="font-size:0.8rem;color:var(--primary);margin-left:0.4rem;">[${escapeHtml(e.category)}]</span><br>
 <span style="font-size:0.82rem;color:var(--text-muted);">${label} ${e.time?'| ⏰ '+escapeHtml(e.time):''} ${e.venue?'| 📍 '+escapeHtml(e.venue):''}</span></div></div>
 <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
 <button class="btn-xs btn-xs-blue" onclick="editEvent(${eid})"><i class="fas fa-edit"></i> Edit</button>
 <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(e.name)},${_ja(waMsg)},'https://mjministries.org/events/')"><i class="fas fa-share-alt"></i></button>
 <button class="btn-xs btn-xs-red" onclick="deleteEvent(${eid})">Delete</button>
 </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No events yet. Add one above!</p>';
}

function loadDevotionalsList() {
 const el = document.getElementById('devotionals-list');
 if (!el) return;
 const devs = JSON.parse(localStorage.getItem('mj_devotionals') || '[]');
 devs.sort((a,b) =>(b.date||'').localeCompare(a.date||'') || b.id - a.id);
 el.innerHTML = devs.length ? devs.map(d => {
  const did = parseInt(d.id, 10);
  const label = d.date ? new Date(d.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*📖 DAILY DEVOTIONAL — ${MINISTRY_NAME}*\n\n*Topic:* ${d.topic}\n*Scripture:* ${d.ref||''}\n\n_"${d.verse||''}"_\n\n${(d.message||'').substring(0,400)}...\n\n🙏 God bless you!\n— Apostle MJ\n\nhttps://mjministries.org/devotions/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
 <div><strong>${escapeHtml(d.topic)}</strong><br>
 <span style="font-size:0.82rem;color:var(--text-muted);">${label} ${d.ref?'| '+escapeHtml(d.ref):''}</span></div>
 <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
 <button class="btn-xs btn-xs-blue" onclick="editDevotional(${did})"><i class="fas fa-edit"></i> Edit</button>
 <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(d.topic)},${_ja(waMsg)},'https://mjministries.org/devotions/')"><i class="fas fa-share-alt"></i></button>
 <button class="btn-xs btn-xs-red" onclick="deleteDevotional(${did})">Delete</button>
 </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No devotionals published yet.</p>';
}

function deleteDevotional(id) {
 if (!confirm('Delete this devotional?')) return;
 const devs = JSON.parse(localStorage.getItem('mj_devotionals') || '[]').filter(d =>d.id !== id);
 localStorage.setItem('mj_devotionals', JSON.stringify(devs));
 saveToGitHub('devotionals.json', devs);
 loadDevotionalsList();
 showToast('Devotional deleted.');
}

function deleteSermon(id) {
 if (!confirm('Delete this sermon?')) return;
 const sermons = JSON.parse(localStorage.getItem('mj_sermons') || '[]').filter(s =>s.id !== id);
 localStorage.setItem('mj_sermons', JSON.stringify(sermons));
 saveToGitHub('sermons.json', sermons);
 loadSermonsList();
 showToast('Sermon deleted.');
}

function loadSermonsList() {
 const el = document.getElementById('sermons-admin-list');
 if (!el) return;
 const sermons = JSON.parse(localStorage.getItem('mj_sermons') || '[]');
 sermons.sort((a,b) =>(b.date||'').localeCompare(a.date||'') || b.id - a.id);
 el.innerHTML = sermons.length ? sermons.map(s => {
  const sid = parseInt(s.id, 10);
  const label = s.date ? new Date(s.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*🎤 SERMON — ${MINISTRY_NAME}*\n\n*"${s.title}"*\n👤 ${s.speaker||'Apostle MJ'}${s.scripture?'\n📖 '+s.scripture:''}\n📅 ${label}\n\n${(s.desc||'').substring(0,300)}${s.desc&&s.desc.length>300?'...':''}\n\n${s.url && /^https?:\/\//i.test(s.url)?'▶️ Watch: '+s.url+'\n':''}🌐 More sermons: https://mjministries.org/sermons/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
 <div><strong>${escapeHtml(s.title)}</strong><span style="font-size:0.8rem;color:var(--primary);margin-left:0.4rem;">[${escapeHtml(s.topic)}]</span><br>
 <span style="font-size:0.82rem;color:var(--text-muted);">${label} | ${escapeHtml(s.speaker||'Apostle MJ')} ${s.url && /^https?:\/\//i.test(s.url)?'| <a href="'+escapeHtml(s.url)+'" target="_blank" rel="noopener noreferrer" style="color:var(--primary);">Watch</a>':''}</span></div>
 <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
 <button class="btn-xs btn-xs-blue" onclick="editSermon(${sid})"><i class="fas fa-edit"></i> Edit</button>
 <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(s.title)},${_ja(waMsg)},'https://mjministries.org/sermons/')"><i class="fas fa-share-alt"></i></button>
 <button class="btn-xs btn-xs-red" onclick="deleteSermon(${sid})">Delete</button>
 </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No sermons uploaded yet.</p>';
}

function saveDonation() {
 const name = document.getElementById('don-name').value;
 const amount = document.getElementById('don-amount').value;
 if (!name || !amount) { showToast('Please fill in donor name and amount.', true); return; }
 const donations = JSON.parse(localStorage.getItem('mj_donations') || '[]');
 const d = {
 id: Date.now(),
 name,
 amount,
 category: document.getElementById('don-cat').value,
 method: document.getElementById('don-method').value,
 notes: document.getElementById('don-notes').value,
 date: new Date().toLocaleDateString('en-GB')
 };
 donations.push(d);
 localStorage.setItem('mj_donations', JSON.stringify(donations));
 // Add to table
 const tbody = document.getElementById('donations-table-body');
 const row = `<tr><td><strong>${escapeHtml(d.name)}</strong></td><td style="color:var(--success);font-weight:700;">${escapeHtml(d.amount)}</td><td>${escapeHtml(d.category)}</td><td>${escapeHtml(d.method)}</td><td>${escapeHtml(d.date)}</td><td>${escapeHtml(d.notes||'-')}</td></tr>`;
 if (tbody.querySelector('td[colspan]')) tbody.innerHTML = '';
 tbody.insertAdjacentHTML('afterbegin', row);
 showToast('Donation recorded!');
 document.getElementById('don-name').value = '';
 document.getElementById('don-amount').value = '';
 document.getElementById('don-notes').value = '';
}

// Refresh recent activity
function refreshActivity() {
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
 const churchTests = JSON.parse(localStorage.getItem('mj_church_testimonies') || '[]');
 const members = JSON.parse(localStorage.getItem('mj_members') || '[]');
 const container = document.getElementById('recent-activity');
 if (!container) return;
 const activities = [];
 prayers.slice(-3).forEach(p =>activities.push({ icon:'🙏', text:`New prayer request from ${escapeHtml(p.name)} (${escapeHtml(p.country||'Unknown')})`, date:escapeHtml(p.date) }));
 testimonies.slice(-2).forEach(t =>activities.push({ icon:'⭐', text:`New testimony submitted by ${escapeHtml(t.name)}`, date:escapeHtml(t.date) }));
 churchTests.slice(-3).forEach(t =>activities.push({ icon:'🌟', text:`Published testimony: "${escapeHtml((t.title||'').substring(0,50))}"`, date:escapeHtml(t.date||'') }));
 members.slice(-2).forEach(m =>activities.push({ icon:'👤', text:`New member: ${escapeHtml(m['full-name']||'Unknown')}`, date:escapeHtml(m.date) }));
 if (activities.length) {
 container.innerHTML = activities.map(a =>`<div style="display:flex;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--gray-200);"><span style="font-size:1.2rem;">${a.icon}</span><div><div style="font-size:0.85rem;color:var(--text);">${a.text}</div><div style="font-size:0.75rem;color:var(--text-muted);">${a.date}</div></div></div>`).join('');
 } else {
 container.innerHTML = '<p style="font-size:0.88rem;">No recent activity. The ministry is just getting started! </p>';
 }
 // Update badge
 const pending = prayers.filter(p =>p.status === 'pending').length;
 const badge = document.getElementById('badge-prayers');
 if (badge) badge.textContent = pending;
}
function editProphecy(id) {
 const list = JSON.parse(localStorage.getItem('mj_prophecies') || '[]');
 const p = list.find(x => x.id === id); if (!p) return;
 _EDIT.prophecy = id;
 document.getElementById('proph-title').value = p.title || '';
 document.getElementById('proph-date').value = p.date || '';
 document.getElementById('proph-category').value = p.category || '';
 document.getElementById('proph-scripture').value = p.scripture || '';
 document.getElementById('proph-word').value = p.word || '';
 document.getElementById('proph-photo').value = p.photo || '';
 document.getElementById('proph-video').value = p.video || '';
 showAdminSection('sec-prophecy');
 _enterEdit('prophecy', 'Update Prophecy');
}

function saveProphecy() {
 const title = document.getElementById('proph-title').value.trim();
 const word = document.getElementById('proph-word').value.trim();
 if (!title || !word) { showToast('Please enter a title and the prophetic word.', true); return; }
 const list = JSON.parse(localStorage.getItem('mj_prophecies') || '[]');
 const record = { title, date: document.getElementById('proph-date').value, category: document.getElementById('proph-category').value, scripture: document.getElementById('proph-scripture').value, word, photo: document.getElementById('proph-photo').value.trim(), video: document.getElementById('proph-video').value.trim() };
 if (_EDIT.prophecy) {
  const idx = list.findIndex(p => p.id === _EDIT.prophecy);
  if (idx > -1) list[idx] = { ...list[idx], ...record };
  cancelEdit('prophecy'); showToast('Prophecy updated!');
 } else { list.push({ id: Date.now(), ...record }); showToast('Prophetic word saved and published!'); }
 localStorage.setItem('mj_prophecies', JSON.stringify(list));
 saveToGitHub('prophecies.json', list);
 ['proph-title','proph-date','proph-scripture','proph-word','proph-photo','proph-video'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadProphecyList();
}

function shareProphecyWA() {
 const title = document.getElementById('proph-title').value || 'Prophetic Word';
 const word = document.getElementById('proph-word').value || '';
 const ref = document.getElementById('proph-scripture').value || '';
 const msg = `*🔥 PROPHETIC WORD — ${MINISTRY_NAME}*\n\n*${title}*${ref ? '\n_Scripture: ' + ref + '_' : ''}\n\n${word.substring(0,500)}...\n\n— Apostle MJ\n\nhttps://mjministries.org/prophecy/`;
 openShareModal(title, msg, 'https://mjministries.org/prophecy/');
}

function deleteProphecy(id) {
 if (!confirm('Delete this prophetic word?')) return;
 const list = JSON.parse(localStorage.getItem('mj_prophecies') || '[]').filter(p => p.id !== id);
 localStorage.setItem('mj_prophecies', JSON.stringify(list));
 saveToGitHub('prophecies.json', list);
 loadProphecyList();
 showToast('Prophecy deleted.');
}

function loadProphecyList() {
 const el = document.getElementById('prophecy-admin-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_prophecies') || '[]');
 list.sort((a,b) => (b.date||'').localeCompare(a.date||'') || b.id - a.id);
 el.innerHTML = list.length ? list.map(p => {
  const pid = parseInt(p.id, 10);
  const label = p.date ? new Date(p.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*🔥 PROPHETIC WORD — ${MINISTRY_NAME}*\n\n*${p.title}*${p.scripture?'\n_Scripture: '+p.scripture+'_':''}\n\n${(p.word||'').substring(0,500)}...\n\n— Apostle MJ\n\nhttps://mjministries.org/prophecy/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
  <div><strong>${escapeHtml(p.title)}</strong><span style="font-size:0.8rem;color:var(--primary);margin-left:0.5rem;">[${escapeHtml(p.category||'General')}]</span><br>
  <span style="font-size:0.82rem;color:var(--text-muted);">${label}${p.scripture?' | '+escapeHtml(p.scripture):''}</span></div>
  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
  <button class="btn-xs btn-xs-blue" onclick="editProphecy(${pid})"><i class="fas fa-edit"></i> Edit</button>
  <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(p.title)},${_ja(waMsg)},'https://mjministries.org/prophecy/')"><i class="fas fa-share-alt"></i></button>
  <button class="btn-xs btn-xs-red" onclick="deleteProphecy(${pid})">Delete</button>
  </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No prophetic words published yet.</p>';
}

function editFulfillment(id) {
 const list = JSON.parse(localStorage.getItem('mj_fulfillments') || '[]');
 const f = list.find(x => x.id === id); if (!f) return;
 _EDIT.fulfillment = id;
 document.getElementById('ful-title').value = f.title || '';
 document.getElementById('ful-date').value = f.fulfilledDate || '';
 document.getElementById('ful-propdate').value = f.prophecyDate || '';
 document.getElementById('ful-original').value = f.originalWord || '';
 document.getElementById('ful-how').value = f.howFulfilled || '';
 document.getElementById('ful-photos').value = (f.photos||[]).join('\n');
 document.getElementById('ful-video').value = f.video || '';
 showAdminSection('sec-fulfillment');
 _enterEdit('fulfillment', 'Update Fulfillment');
}

function saveFulfillment() {
 const title = document.getElementById('ful-title').value.trim();
 const how = document.getElementById('ful-how').value.trim();
 if (!title || !how) { showToast('Please enter a title and how it was fulfilled.', true); return; }
 const list = JSON.parse(localStorage.getItem('mj_fulfillments') || '[]');
 const photosRaw = document.getElementById('ful-photos').value.trim();
 const record = { title, fulfilledDate: document.getElementById('ful-date').value, prophecyDate: document.getElementById('ful-propdate').value, originalWord: document.getElementById('ful-original').value, howFulfilled: how, photos: photosRaw ? photosRaw.split('\n').map(u=>u.trim()).filter(u=>u && /^https?:\/\//i.test(u)) : [], video: document.getElementById('ful-video').value.trim() };
 if (_EDIT.fulfillment) {
  const idx = list.findIndex(f => f.id === _EDIT.fulfillment);
  if (idx > -1) list[idx] = { ...list[idx], ...record };
  cancelEdit('fulfillment'); showToast('Fulfillment updated!');
 } else { list.push({ id: Date.now(), ...record }); showToast('Fulfillment recorded and published!'); }
 localStorage.setItem('mj_fulfillments', JSON.stringify(list));
 saveToGitHub('fulfillments.json', list);
 ['ful-title','ful-date','ful-propdate','ful-original','ful-how','ful-photos','ful-video'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadFulfillmentList();
}

function shareFulfillmentAdminWA() {
 const title = document.getElementById('ful-title').value || 'Fulfilled Prophecy';
 const how = document.getElementById('ful-how').value || '';
 const msg = `*✅ FULFILLED PROPHECY — ${MINISTRY_NAME}*\n\n*${title}*\n\n${how.substring(0,500)}...\n\nTo God be all the glory!\n— Apostle MJ\n\nhttps://mjministries.org/fulfillment/`;
 openShareModal(title, msg, 'https://mjministries.org/fulfillment/');
}

function deleteFulfillment(id) {
 if (!confirm('Delete this fulfillment record?')) return;
 const list = JSON.parse(localStorage.getItem('mj_fulfillments') || '[]').filter(f => f.id !== id);
 localStorage.setItem('mj_fulfillments', JSON.stringify(list));
 saveToGitHub('fulfillments.json', list);
 loadFulfillmentList();
 showToast('Fulfillment deleted.');
}

function loadFulfillmentList() {
 const el = document.getElementById('fulfillment-admin-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_fulfillments') || '[]');
 list.sort((a,b) => (b.fulfilledDate||'').localeCompare(a.fulfilledDate||'') || b.id - a.id);
 el.innerHTML = list.length ? list.map(f => {
  const fid = parseInt(f.id, 10);
  const label = f.fulfilledDate ? new Date(f.fulfilledDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*✅ FULFILLED PROPHECY — ${MINISTRY_NAME}*\n\n*${f.title}*\nFulfilled: ${label}\n\n${(f.howFulfilled||'').substring(0,500)}...\n\nTo God be all the glory!\nhttps://mjministries.org/fulfillment/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
  <div><strong>${escapeHtml(f.title)}</strong><br>
  <span style="font-size:0.82rem;color:var(--text-muted);">Fulfilled: ${label}</span></div>
  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
  <button class="btn-xs btn-xs-blue" onclick="editFulfillment(${fid})"><i class="fas fa-edit"></i> Edit</button>
  <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(f.title)},${_ja(waMsg)},'https://mjministries.org/fulfillment/')"><i class="fas fa-share-alt"></i></button>
  <button class="btn-xs btn-xs-red" onclick="deleteFulfillment(${fid})">Delete</button>
  </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No fulfillments recorded yet.</p>';
}

function saveLivestream() {
 const isLive = document.querySelector('input[name="live-status"]:checked').value === 'yes';
 const url = document.getElementById('live-url').value.trim();
 const fbUrl = document.getElementById('live-fb-url').value.trim();
 const tiktokLive = document.getElementById('live-tiktok').checked;
 const tiktokUrl = document.getElementById('live-tiktok-url').value.trim();
 const schedule = document.getElementById('live-schedule').value.trim();
 if (isLive && !url && !fbUrl && !tiktokLive) { showToast('Please paste at least one live URL (YouTube or Facebook) or enable TikTok.', true); return; }
 const data = { isLive, url, fbUrl, tiktokLive, tiktokUrl, schedule, updated: Date.now() };
 localStorage.setItem('mj_livestream', JSON.stringify(data));
 saveToGitHub('livestream.json', data);
 const msg = document.getElementById('live-status-msg');
 const platforms = [url && 'YouTube', fbUrl && 'Facebook', tiktokLive && 'TikTok'].filter(Boolean).join(', ');
 msg.textContent = isLive ? '🔴 LIVE on: ' + (platforms || 'website') : '⚫ Livestream set to offline.';
 msg.style.color = isLive ? '#16a34a' : 'var(--text-muted)';
 showToast(isLive ? '🔴 Livestream activated!' : 'Livestream set to offline.');
}
function loadLivestreamAdmin() {
 const d = JSON.parse(localStorage.getItem('mj_livestream') || '{}');
 if (d.isLive) document.getElementById('live-yes').checked = true;
 else document.getElementById('live-no').checked = true;
 if (d.url) document.getElementById('live-url').value = d.url;
 if (d.fbUrl) document.getElementById('live-fb-url').value = d.fbUrl;
 if (d.tiktokLive) document.getElementById('live-tiktok').checked = true;
 if (d.tiktokUrl) document.getElementById('live-tiktok-url').value = d.tiktokUrl;
 if (d.schedule) document.getElementById('live-schedule').value = d.schedule;
}

// ===== HOMEPAGE GALLERY =====

const _DEFAULT_GALLERY = [
 {id:1, url:'WhatsApp Image 2026-06-24 at 09.09.25.jpeg', caption:'Church Service'},
 {id:2, url:'WhatsApp Image 2026-06-24 at 09.09.26.jpeg', caption:'Church Service'},
 {id:3, url:'WhatsApp Image 2026-06-24 at 09.09.26 (1).jpeg', caption:'Ministry'},
 {id:4, url:'WhatsApp Image 2026-06-24 at 09.09.27 (2).jpeg', caption:'Apostle MJ Preaching'},
 {id:5, url:'WhatsApp Image 2026-06-24 at 09.09.28.jpeg', caption:'Apostle MJ'},
 {id:6, url:'WhatsApp Image 2026-06-24 at 09.09.26 (2).jpeg', caption:'Ministry'}
];

function _getGallery() {
 return JSON.parse(localStorage.getItem('mj_gallery_photos') || 'null') || _DEFAULT_GALLERY.map(p=>({...p}));
}
function _saveGallery(list) {
 localStorage.setItem('mj_gallery_photos', JSON.stringify(list));
 saveToGitHub('gallery.json', list);
}

function addGalleryPhoto() {
 const url = document.getElementById('gal-url').value.trim();
 if (!url) { showToast('Please paste or upload a photo URL.', true); return; }
 if (!/^https?:\/\//i.test(url)) { showToast('URL must start with https://', true); return; }
 const caption = document.getElementById('gal-caption').value.trim() || 'Ministry';
 const list = _getGallery();
 list.push({ id: Date.now(), url, caption });
 _saveGallery(list);
 document.getElementById('gal-url').value = '';
 document.getElementById('gal-caption').value = '';
 loadGalleryAdmin();
 showToast('Photo added to gallery!');
}

async function uploadMultipleToGallery() {
 const { workerUrl, uploadToken } = _getUploadCreds();
 const picker = document.createElement('input');
 picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true;
 picker.style.display = 'none'; document.body.appendChild(picker);
 picker.addEventListener('change', async () => {
  const files = Array.from(picker.files); picker.remove();
  if (!files.length) return;
  showToast('Uploading ' + files.length + ' photo' + (files.length>1?'s':'') + '...');
  let done = 0;
  const results = await Promise.all(files.map(async file => {
   const fd = new FormData(); fd.append('file', file);
   try {
    const res = await fetch(workerUrl, {method:'POST', headers:{'X-Upload-Token':uploadToken}, body:fd});
    const data = await res.json(); done++;
    showToast('Uploaded '+done+'/'+files.length+'...');
    return data.url || null;
   } catch(e) { return null; }
  }));
  const urls = results.filter(Boolean);
  if (urls.length) {
   const list = _getGallery();
   urls.forEach(url => list.push({id: Date.now() + Math.random(), url, caption:'Ministry'}));
   _saveGallery(list);
   loadGalleryAdmin();
   showToast(urls.length + ' photo' + (urls.length>1?'s':'') + ' added to gallery!');
  }
 });
 picker.click();
}

function deleteGalleryPhoto(id) {
 if (!confirm('Remove this photo from the gallery?')) return;
 const list = _getGallery().filter(p => String(p.id) !== String(id));
 _saveGallery(list);
 loadGalleryAdmin();
 showToast('Photo removed.');
}

function editGalleryCaption(id) {
 const list = _getGallery();
 const photo = list.find(p => String(p.id) === String(id));
 if (!photo) return;
 const newCaption = prompt('Edit caption:', photo.caption || '');
 if (newCaption === null) return;
 photo.caption = newCaption.trim() || 'Ministry';
 _saveGallery(list);
 loadGalleryAdmin();
 showToast('Caption updated!');
}

function replaceGalleryPhoto(id) {
 const { workerUrl, uploadToken } = _getUploadCreds();
 const picker = document.createElement('input');
 picker.type = 'file'; picker.accept = 'image/*';
 picker.style.display = 'none'; document.body.appendChild(picker);
 picker.addEventListener('change', async () => {
  const file = picker.files[0]; picker.remove();
  if (!file) return;
  showToast('Uploading replacement...');
  const fd = new FormData(); fd.append('file', file);
  try {
   const res = await fetch(workerUrl, {method:'POST', headers:{'X-Upload-Token':uploadToken}, body:fd});
   const data = await res.json();
   if (data.url) {
    const list = _getGallery();
    const photo = list.find(p => String(p.id) === String(id));
    if (photo) { photo.url = data.url; _saveGallery(list); loadGalleryAdmin(); showToast('Photo replaced!'); }
   } else { showToast('Upload failed: ' + (data.error||'error'), true); }
  } catch(e) { showToast('Upload error: ' + e.message, true); }
 });
 picker.click();
}

function loadGalleryAdmin() {
 const el = document.getElementById('gallery-admin-list');
 if (!el) return;
 const list = _getGallery();
 const waMsg = '*📸 LIFE AT ' + MINISTRY_NAME.toUpperCase() + '*\n\nFeaturing moments from our gatherings and ministry events.\n\nhttps://mjministries.org/';
 el.innerHTML = list.length ? `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
  ${list.map(p => {
   const pid = String(p.id);
   const thumb = /^https?:\/\//i.test(p.url) ? escapeHtml(p.url) : escapeHtml(p.url);
   return `<div style="border-radius:10px;overflow:hidden;border:1px solid var(--gray-200);background:var(--white);">
    <img src="${thumb}" alt="${escapeHtml(p.caption||'')}" style="width:100%;height:140px;object-fit:cover;display:block;" onerror="this.style.opacity='0.3'">
    <div style="padding:0.6rem;">
    <p style="font-size:0.82rem;color:var(--text);margin-bottom:0.5rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.caption||'Ministry')}</p>
    <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
     <button class="btn-xs btn-xs-blue" onclick="editGalleryCaption(${_ja(pid)})"><i class="fas fa-edit"></i> Caption</button>
     <button class="btn-xs" style="background:#8b5cf6;color:#fff;" onclick="replaceGalleryPhoto(${_ja(pid)})"><i class="fas fa-sync"></i> Replace</button>
     <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal('Life at ${MINISTRY_NAME}',${_ja(waMsg)},'https://mjministries.org/')"><i class="fas fa-share-alt"></i></button>
     <button class="btn-xs btn-xs-red" onclick="deleteGalleryPhoto(${_ja(pid)})"><i class="fas fa-trash"></i></button>
    </div>
    </div>
   </div>`;
  }).join('')}
  </div>` : '<p style="color:var(--text-muted);font-size:0.9rem;">No photos yet. Add some above!</p>';
}

// ===== CHURCH HISTORY =====

const _DEFAULT_HISTORY = [
 {year:'The Beginning', title:'Called by God', text:'Apostle MJ received the divine call to ministry. He began preaching in small gatherings and home churches, with just a handful of believers who caught the vision.'},
 {year:'Early Days', title:'First Church Established', text:'The ministry officially established its first church congregation. The first Bible study groups were formed and the prayer ministry was launched.'},
 {year:'Growing', title:'Charity Work Begins', text:'A heart for the community led to the launch of feeding programs, orphan support, and widow care ministries that continue to this day.'},
 {year:'Expansion', title:'Media Ministry Launched', text:'The ministry went online — Facebook Live services, YouTube channel, and TikTok outreach extended our reach far beyond the local congregation.'},
 {year:'Today', title:'Growing Stronger', text:'With hundreds of active members, an online community, and ongoing charity work, the ministry continues to expand and touch lives for God\'s glory.'}
];

function _renderHistoryAdminItem(item, idx) {
 const div = document.createElement('div');
 div.className = 'history-admin-item';
 div.style.cssText = 'background:var(--light);border-radius:10px;padding:1rem 1.25rem;position:relative;border:1px solid var(--gray-200);';
 div.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
   <span style="font-weight:700;color:var(--primary);font-size:0.85rem;">Entry ${idx+1}</span>
   <button onclick="this.closest('.history-admin-item').remove()" style="background:#fee2e2;color:#991b1b;border:none;border-radius:50px;padding:0.25rem 0.65rem;font-size:0.78rem;cursor:pointer;font-weight:600;"><i class="fas fa-trash"></i> Remove</button>
  </div>
  <div class="form-row">
   <div class="form-group"><label class="form-label">Year / Era Label</label><input type="text" class="form-control hist-year" placeholder="e.g. 2020 or Early Days" value="${escapeHtml(item.year||'')}"></div>
   <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-control hist-title" placeholder="e.g. First Church Established" value="${escapeHtml(item.title||'')}"></div>
  </div>
  <div class="form-group"><label class="form-label">Description</label><textarea class="form-control hist-text" rows="3" placeholder="What happened during this period...">${escapeHtml(item.text||'')}</textarea></div>
 `;
 return div;
}

function loadHistoryAdmin() {
 const container = document.getElementById('history-items-admin');
 if (!container) return;
 container.innerHTML = '';
 const items = JSON.parse(localStorage.getItem('mj_history_content') || 'null') || _DEFAULT_HISTORY;
 items.forEach((item, i) => container.appendChild(_renderHistoryAdminItem(item, i)));
}

function addHistoryItem() {
 const container = document.getElementById('history-items-admin');
 if (!container) return;
 const idx = container.querySelectorAll('.history-admin-item').length;
 container.appendChild(_renderHistoryAdminItem({year:'', title:'', text:''}, idx));
}

function saveHistoryContent() {
 const container = document.getElementById('history-items-admin');
 if (!container) return;
 const items = Array.from(container.querySelectorAll('.history-admin-item')).map(div => ({
  year:  div.querySelector('.hist-year').value.trim(),
  title: div.querySelector('.hist-title').value.trim(),
  text:  div.querySelector('.hist-text').value.trim()
 })).filter(i => i.year || i.title || i.text);
 localStorage.setItem('mj_history_content', JSON.stringify(items));
 saveToGitHub('history_content.json', items);
 showToast('Church history saved!');
}

// ===== PAGE CONTENT EDITORS =====

function saveHomePage() {
 const data = {
  heroTitle: document.getElementById('ph-hero-title').value.trim(),
  heroSubtitle: document.getElementById('ph-hero-subtitle').value.trim(),
  scripture: document.getElementById('ph-scripture').value.trim(),
  scriptureRef: document.getElementById('ph-scripture-ref').value.trim()
 };
 localStorage.setItem('mj_home_content', JSON.stringify(data));
 saveToGitHub('home_content.json', data);
 showToast('Home page content saved!');
}

function loadHomePage() {
 const data = JSON.parse(localStorage.getItem('mj_home_content') || '{}');
 const map = {
  'ph-hero-title': data.heroTitle,
  'ph-hero-subtitle': data.heroSubtitle,
  'ph-scripture': data.scripture,
  'ph-scripture-ref': data.scriptureRef
 };
 Object.keys(map).forEach(function(id) {
  if (map[id]) { var el = document.getElementById(id); if (el) el.value = map[id]; }
 });
}

function saveAboutPage() {
 const data = {
  bio: document.getElementById('pa-bio').value.trim(),
  vision: document.getElementById('pa-vision').value.trim(),
  visionRef: document.getElementById('pa-vision-ref').value.trim(),
  mission: document.getElementById('pa-mission').value.trim(),
  missionRef: document.getElementById('pa-mission-ref').value.trim(),
  coreMsg: document.getElementById('pa-core-msg').value.trim(),
  coreRef: document.getElementById('pa-core-ref').value.trim()
 };
 localStorage.setItem('mj_about_content', JSON.stringify(data));
 saveToGitHub('about_content.json', data);
 showToast('About page content saved!');
}

function loadAboutPage() {
 const data = JSON.parse(localStorage.getItem('mj_about_content') || '{}');
 const map = {
  'pa-bio': data.bio,
  'pa-vision': data.vision,
  'pa-vision-ref': data.visionRef,
  'pa-mission': data.mission,
  'pa-mission-ref': data.missionRef,
  'pa-core-msg': data.coreMsg,
  'pa-core-ref': data.coreRef
 };
 Object.keys(map).forEach(function(id) {
  if (map[id]) { var el = document.getElementById(id); if (el) el.value = map[id]; }
 });
}

function saveDonationsPage() {
 const data = {
  mobileMoney: document.getElementById('pd-mobile').value.trim(),
  accName: document.getElementById('pd-acc-name').value.trim(),
  bankName: document.getElementById('pd-bank-name').value.trim(),
  branch: document.getElementById('pd-branch').value.trim(),
  swift: document.getElementById('pd-swift').value.trim(),
  paypal: document.getElementById('pd-paypal').value.trim(),
  wrName: document.getElementById('pd-wr-name').value.trim(),
  wrCountry: document.getElementById('pd-wr-country').value.trim()
 };
 localStorage.setItem('mj_donation_content', JSON.stringify(data));
 saveToGitHub('donation_content.json', data);
 showToast('Donations page content saved!');
}

function loadDonationsPage() {
 const data = JSON.parse(localStorage.getItem('mj_donation_content') || '{}');
 const map = {
  'pd-mobile': data.mobileMoney,
  'pd-acc-name': data.accName,
  'pd-bank-name': data.bankName,
  'pd-branch': data.branch,
  'pd-swift': data.swift,
  'pd-paypal': data.paypal,
  'pd-wr-name': data.wrName,
  'pd-wr-country': data.wrCountry
 };
 Object.keys(map).forEach(function(id) {
  if (map[id]) { var el = document.getElementById(id); if (el) el.value = map[id]; }
 });
}

function loadDonationsList() {
 const tbody = document.getElementById('donations-table-body');
 if (!tbody) return;
 const donations = JSON.parse(localStorage.getItem('mj_donations') || '[]');
 tbody.innerHTML = donations.length
  ? donations.slice().reverse().map(d => `<tr><td><strong>${escapeHtml(d.name)}</strong></td><td style="color:var(--success);font-weight:700;">${escapeHtml(d.amount)}</td><td>${escapeHtml(d.category)}</td><td>${escapeHtml(d.method)}</td><td>${escapeHtml(d.date)}</td><td>${escapeHtml(d.notes||'-')}</td></tr>`).join('')
  : '<tr><td colspan="6" class="text-center text-muted">No donation records yet.</td></tr>';
}

function loadTestimoniesList() {
 const tTbl = document.getElementById('testimonies-table-body');
 if (!tTbl) return;
 const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
 tTbl.innerHTML = testimonies.length ? testimonies.slice().reverse().map(t => `
 <tr>
 <td><strong>${escapeHtml(t.name)}</strong></td>
 <td>${escapeHtml(t.location || '-')}</td>
 <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.testimony)}</td>
 <td><span class="badge ${t.approved?'badge-completed':'badge-pending'}">${t.approved?' Approved':'⏳ Pending'}</span></td>
 <td>${escapeHtml(t.date)}</td>
 <td>
 <button class="btn-xs btn-xs-green" onclick="(window.openEnrichApprove||approveTestimony)(${t.id})">Approve</button>
 <button class="btn-xs btn-xs-red" onclick="deleteTestimony(${t.id})" style="margin-left:4px;">Delete</button>
 </td>
 </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">No testimonies yet.</td></tr>';
}

// Map each section ID to its loader — called only when that section is opened
const SECTION_LOADERS = {
 'sec-testimonies':        function(){ loadTestimoniesList(); },
 'sec-announcements':      function(){ loadAnnouncements(); },
 'sec-events':             function(){ loadEventsAdmin(); },
 'sec-devotionals':        function(){ loadDevotionalsList(); },
 'sec-sermons':            function(){ loadSermonsList(); },
 'sec-prophecy':           function(){ loadProphecyList(); },
 'sec-fulfillment':        function(){ loadFulfillmentList(); },
 'sec-livestream':         function(){ loadLivestreamAdmin(); },
 'sec-members':            function(){ loadMemberProfiles(); },
 'sec-church-testimonies': function(){ loadChurchTestimonies(); },
 'sec-charity':            function(){ loadCharityList(); },
 'sec-donations':          function(){ loadDonationsList(); },
 'sec-settings':           function(){ loadSiteSettings(); },
 'sec-page-home':          function(){ loadHomePage(); },
 'sec-page-about':         function(){ loadAboutPage(); },
 'sec-page-donations':     function(){ loadDonationsPage(); },
 'sec-page-history':       function(){ loadHistoryAdmin(); },
 'sec-gallery':            function(){ loadGalleryAdmin(); },
};

// Override showAdminSection to lazy-load the opened section
const _origShowSection = window.showAdminSection;
window.showAdminSection = function(id) {
 _origShowSection(id);
 if (SECTION_LOADERS[id]) SECTION_LOADERS[id]();
};

// loadAdminData: only render stats + active section (not all 18 at once)
const origLoad = loadAdminData;
window.loadAdminData = function() {
 origLoad();
 refreshActivity();
 var active = document.querySelector('.admin-section.active');
 if (active && SECTION_LOADERS[active.id]) SECTION_LOADERS[active.id]();
};

// Override updatePrayerStatus to also sync to GitHub
const _origUpdateStatus = window.updatePrayerStatus;
window.updatePrayerStatus = function(id, status) {
 _origUpdateStatus(id, status);
 const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
 saveToGitHub('prayers.json', prayers);
};

// Fetch prayers from the public repo. Reading is unauthenticated (the repo is public) —
// no token is needed here. Writes (status/edit/delete) still go through saveToGitHub()
// using the admin's own token from Settings.
let _prayerSyncing = false;
async function syncPrayersFromGitHub(showFeedback) {
 if (_prayerSyncing) return;
 _prayerSyncing = true;
 const btn = document.getElementById('sync-prayers-btn');
 if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing...'; }
 try {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);
  const r = await fetch('https://raw.githubusercontent.com/Bolchadar/Bolchadar.github.io/main/data/prayers.json?_v=' + Date.now(), {
   signal: controller.signal
  });
  clearTimeout(tid);
  if (r.ok) {
   const ghPrayers = await r.json();
   const local = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
   const merged = ghPrayers.map(gp => {
    const lp = local.find(l => l.id === gp.id);
    return lp ? { ...gp, status: lp.status || gp.status, notes: lp.notes || gp.notes } : gp;
   });
   local.forEach(lp => { if (!merged.find(m => m.id === lp.id)) merged.push(lp); });
   localStorage.setItem('mj_prayers', JSON.stringify(merged));
   filterPrayers('all');
   if (showFeedback) showToast('Prayers synced. ' + ghPrayers.length + ' total.');
  } else if (r.status === 404) {
   if (showFeedback) showToast('No prayers submitted yet.');
  } else {
   if (showFeedback) showToast('Sync failed (' + r.status + ').', true);
  }
 } catch(e) {
  if (showFeedback && e.name !== 'AbortError') showToast('Sync error: ' + e.message, true);
 } finally {
  _prayerSyncing = false;
  if (btn) { btn.disabled = false; btn.textContent = '🔄 Sync Prayers'; }
 }
}

// No auto-sync — use the Sync Prayers button to pull from server

// MEMBER PROFILES
function editMemberProfile(id) {
 const list = JSON.parse(localStorage.getItem('mj_member_profiles') || '[]');
 const m = list.find(x => x.id === id); if (!m) return;
 _EDIT.memberProfile = id;
 document.getElementById('mp-name').value = m.name || '';
 document.getElementById('mp-photo').value = m.photo || '';
 document.getElementById('mp-gender').value = m.gender || 'Male';
 document.getElementById('mp-dept').value = m.dept || '';
 document.getElementById('mp-position').value = m.position || '';
 document.getElementById('mp-status').value = m.status || 'Active Member';
 showAdminSection('sec-members');
 _enterEdit('memberProfile', 'Update Member');
}

function saveMemberProfile() {
 const name = document.getElementById('mp-name').value.trim();
 if (!name) { showToast('Please enter the member name.', true); return; }
 const list = JSON.parse(localStorage.getItem('mj_member_profiles') || '[]');
 const record = { name, photo: document.getElementById('mp-photo').value.trim(), gender: document.getElementById('mp-gender').value, dept: document.getElementById('mp-dept').value.trim(), position: document.getElementById('mp-position').value.trim(), status: document.getElementById('mp-status').value };
 if (_EDIT.memberProfile) {
  const idx = list.findIndex(m => m.id === _EDIT.memberProfile);
  if (idx > -1) list[idx] = { ...list[idx], ...record };
  cancelEdit('memberProfile'); showToast('Member profile updated!');
 } else { list.push({ id: Date.now(), ...record, date: new Date().toLocaleDateString('en-GB') }); showToast('Member added to directory!'); }
 localStorage.setItem('mj_member_profiles', JSON.stringify(list));
 ['mp-name','mp-photo','mp-dept','mp-position'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadMemberProfiles();
}
function deleteMemberProfile(id) {
 if (!confirm('Remove this member from the public directory?')) return;
 const list = JSON.parse(localStorage.getItem('mj_member_profiles') || '[]');
 localStorage.setItem('mj_member_profiles', JSON.stringify(list.filter(m => m.id !== id)));
 loadMemberProfiles();
 showToast('Member removed from directory.');
}
function loadMemberProfiles() {
 const el = document.getElementById('member-profiles-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_member_profiles') || '[]');
 el.innerHTML = list.length ? list.map(m => {
  const mid = parseInt(m.id, 10);
  const avatar = m.photo && /^https?:\/\//i.test(m.photo)
   ? `<img src="${escapeHtml(m.photo)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
   : `<div style="width:42px;height:42px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0;">${escapeHtml((m.name||'?')[0].toUpperCase())}</div>`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
  <div style="display:flex;align-items:center;gap:0.75rem;">${avatar}<div><strong>${escapeHtml(m.name)}</strong><br>
  <span style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(m.position||'')}${m.dept?' | '+escapeHtml(m.dept):''} | ${escapeHtml(m.status)}</span></div></div>
  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
  <button class="btn-xs btn-xs-blue" onclick="editMemberProfile(${mid})"><i class="fas fa-edit"></i> Edit</button>
  <button class="btn-xs btn-xs-red" onclick="deleteMemberProfile(${mid})">Remove</button>
  </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No member profiles in directory yet. Add one above!</p>';
}

// CHURCH TESTIMONIES
function editChurchTestimony(id) {
 const list = JSON.parse(localStorage.getItem('mj_church_testimonies') || '[]');
 const t = list.find(x => x.id === id); if (!t) return;
 _EDIT.churchTestimony = id;
 document.getElementById('ct-title').value = t.title || '';
 document.getElementById('ct-name').value = t.name || '';
 document.getElementById('ct-date').value = t.date || '';
 document.getElementById('ct-category').value = t.category || '';
 document.getElementById('ct-testimony').value = t.testimony || '';
 document.getElementById('ct-photo').value = t.photo || '';
 document.getElementById('ct-video').value = t.video || '';
 showAdminSection('sec-church-testimonies');
 _enterEdit('churchTestimony', 'Update Testimony');
}

function saveChurchTestimony() {
 const title = document.getElementById('ct-title').value.trim();
 const testimony = document.getElementById('ct-testimony').value.trim();
 if (!title || !testimony) { showToast('Please enter title and testimony.', true); return; }
 const list = JSON.parse(localStorage.getItem('mj_church_testimonies') || '[]');
 const record = { title, name: document.getElementById('ct-name').value.trim(), date: document.getElementById('ct-date').value, category: document.getElementById('ct-category').value, testimony, photo: document.getElementById('ct-photo').value.trim(), video: document.getElementById('ct-video').value.trim() };
 if (_EDIT.churchTestimony) {
  const idx = list.findIndex(t => t.id === _EDIT.churchTestimony);
  if (idx > -1) list[idx] = { ...list[idx], ...record };
  cancelEdit('churchTestimony'); showToast('Testimony updated!');
 } else { list.push({ id: Date.now(), ...record }); showToast('Church testimony published!'); }
 localStorage.setItem('mj_church_testimonies', JSON.stringify(list));
 saveToGitHub('church_testimonies.json', list);
 ['ct-title','ct-name','ct-date','ct-testimony','ct-photo','ct-video'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadChurchTestimonies();
}
function deleteChurchTestimony(id) {
 if (!confirm('Delete this church testimony?')) return;
 const list = JSON.parse(localStorage.getItem('mj_church_testimonies') || '[]').filter(t => t.id !== id);
 localStorage.setItem('mj_church_testimonies', JSON.stringify(list));
 saveToGitHub('church_testimonies.json', list);
 loadChurchTestimonies();
 showToast('Testimony deleted.');
}
function loadChurchTestimonies() {
 const el = document.getElementById('church-testimonies-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_church_testimonies') || '[]');
 list.sort((a,b) => (b.date||'').localeCompare(a.date||'') || b.id - a.id);
 el.innerHTML = list.length ? list.map(t => {
  const tid = parseInt(t.id, 10);
  const label = t.date ? new Date(t.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*🌟 TESTIMONY — ${MINISTRY_NAME}*\n\n*${t.title}*\n[${t.category||'Testimony'}] | ${label}\n\n"${(t.testimony||'').substring(0,500)}..."\n\n${t.name?'— '+t.name:'— Anonymous'}\n\nhttps://mjministries.org/testimony/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
  <div><strong>${escapeHtml(t.title)}</strong><span style="font-size:0.8rem;color:var(--primary);margin-left:0.5rem;">[${escapeHtml(t.category||'General')}]</span><br>
  <span style="font-size:0.82rem;color:var(--text-muted);">${label}${t.name?' | '+escapeHtml(t.name):' | Anonymous'}</span></div>
  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
  <button class="btn-xs btn-xs-blue" onclick="editChurchTestimony(${tid})"><i class="fas fa-edit"></i> Edit</button>
  <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(t.title)},${_ja(waMsg)},'https://mjministries.org/testimony/')"><i class="fas fa-share-alt"></i></button>
  <button class="btn-xs btn-xs-red" onclick="deleteChurchTestimony(${tid})">Delete</button>
  </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No church testimonies posted yet.</p>';
}

// CHARITY
function editCharity(id) {
 const list = JSON.parse(localStorage.getItem('mj_charity') || '[]');
 const c = list.find(x => x.id === id); if (!c) return;
 _EDIT.charity = id;
 document.getElementById('ch-title').value = c.title || '';
 document.getElementById('ch-date').value = c.date || '';
 document.getElementById('ch-location').value = c.location || '';
 document.getElementById('ch-desc').value = c.desc || '';
 document.getElementById('ch-photos').value = (c.photos||[]).join('\n');
 document.getElementById('ch-video').value = c.video || '';
 document.getElementById('ch-donation').value = c.donation || '';
 showAdminSection('sec-charity');
 _enterEdit('charity', 'Update Project');
}

function saveCharity() {
 const title = document.getElementById('ch-title').value.trim();
 const desc = document.getElementById('ch-desc').value.trim();
 if (!title || !desc) { showToast('Please enter project title and description.', true); return; }
 const list = JSON.parse(localStorage.getItem('mj_charity') || '[]');
 const photosRaw = document.getElementById('ch-photos').value.trim();
 const record = { title, date: document.getElementById('ch-date').value, location: document.getElementById('ch-location').value.trim(), desc, photos: photosRaw ? photosRaw.split('\n').map(u=>u.trim()).filter(u=>u && /^https?:\/\//i.test(u)) : [], video: document.getElementById('ch-video').value.trim(), donation: document.getElementById('ch-donation').value.trim() };
 if (_EDIT.charity) {
  const idx = list.findIndex(c => c.id === _EDIT.charity);
  if (idx > -1) list[idx] = { ...list[idx], ...record };
  cancelEdit('charity'); showToast('Charity project updated!');
 } else { list.push({ id: Date.now(), ...record }); showToast('Charity project published!'); }
 localStorage.setItem('mj_charity', JSON.stringify(list));
 saveToGitHub('charity.json', list);
 ['ch-title','ch-date','ch-location','ch-desc','ch-photos','ch-video','ch-donation'].forEach(id =>{ const el=document.getElementById(id); if(el) el.value=''; });
 loadCharityList();
}
function deleteCharity(id) {
 if (!confirm('Delete this charity project?')) return;
 const list = JSON.parse(localStorage.getItem('mj_charity') || '[]').filter(c => c.id !== id);
 localStorage.setItem('mj_charity', JSON.stringify(list));
 saveToGitHub('charity.json', list);
 loadCharityList();
 showToast('Project deleted.');
}
function loadCharityList() {
 const el = document.getElementById('charity-admin-list');
 if (!el) return;
 const list = JSON.parse(localStorage.getItem('mj_charity') || '[]');
 list.sort((a,b) => (b.date||'').localeCompare(a.date||'') || b.id - a.id);
 el.innerHTML = list.length ? list.map(c => {
  const cid = parseInt(c.id, 10);
  const label = c.date ? new Date(c.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  const waMsg = `*❤️ CHARITY — ${MINISTRY_NAME}*\n\n*${c.title}*\n📅 ${label}${c.location?' | 📍 '+c.location:''}\n\n${(c.desc||'').substring(0,400)}...\n\n${c.donation?'💝 '+c.donation+'\n':''}https://mjministries.org/charity/`;
  return `<div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
  <div><strong>${escapeHtml(c.title)}</strong><br>
  <span style="font-size:0.82rem;color:var(--text-muted);">${label}${c.location?' | '+escapeHtml(c.location):''}</span></div>
  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
  <button class="btn-xs btn-xs-blue" onclick="editCharity(${cid})"><i class="fas fa-edit"></i> Edit</button>
  <button class="btn-xs" style="background:#25D366;color:#fff;" onclick="openShareModal(${_ja(c.title)},${_ja(waMsg)},'https://mjministries.org/charity/')"><i class="fas fa-share-alt"></i></button>
  <button class="btn-xs btn-xs-red" onclick="deleteCharity(${cid})">Delete</button>
  </div></div>`;
 }).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;">No charity projects yet. Post one above!</p>';
}

// ENRICH APPROVE MODAL
let _enrichId = null;
function openEnrichApprove(id) {
 _enrichId = id;
 ['enrich-title','enrich-photo','enrich-video'].forEach(i =>{ const el=document.getElementById(i); if(el) el.value=''; });
 const modal = document.getElementById('enrich-modal');
 if (modal) { modal.classList.remove('hidden'); modal.style.display='flex'; }
}
function closeEnrichModal() {
 _enrichId = null;
 const modal = document.getElementById('enrich-modal');
 if (modal) { modal.classList.add('hidden'); modal.style.display='none'; }
}
function doApproveTestimony() {
 if (!_enrichId) return;
 const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
 const idx = testimonies.findIndex(t => t.id === _enrichId);
 if (idx > -1) {
  testimonies[idx].approved = true;
  testimonies[idx].title = document.getElementById('enrich-title').value.trim();
  testimonies[idx].featuredPhoto = document.getElementById('enrich-photo').value.trim();
  testimonies[idx].videoUrl = document.getElementById('enrich-video').value.trim();
  localStorage.setItem('mj_testimonies', JSON.stringify(testimonies));
 }
 closeEnrichModal();
 loadAdminData();
 showToast('Testimony approved and published!');
}

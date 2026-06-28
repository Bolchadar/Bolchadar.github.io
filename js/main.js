/* =============================================
   APOSTLE MJ MINISTRIES - Main JavaScript
   =============================================
   UPDATE THIS PHONE NUMBER (with country code, no + or spaces):
*/
const MINISTRY_PHONE = "211921444658"; // +211 921 444 658
const MINISTRY_NAME  = "Apostle MJ Ministries";

/* Store SHA-256 hash of your password — never the plaintext.
   To generate: open browser console and run:
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPassword'))
       .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
   Replace the hash below with the output. */
const ADMIN_PASSWORD_HASH = "58b9317ecf8669d33ea206d7e48e599f507ff589013a9f87b59dd6b131cc6f23";

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function hashPassword(pw) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes = [];
  for (let i = 0; i < pw.length; i++) {
    let c = pw.charCodeAt(i);
    if (c < 0x80) { bytes.push(c); }
    else if (c < 0x800) { bytes.push(0xc0|(c>>6), 0x80|(c&0x3f)); }
    else { bytes.push(0xe0|(c>>12), 0x80|((c>>6)&0x3f), 0x80|(c&0x3f)); }
  }
  const L = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bl = L * 8;
  for (let i = 7; i >= 0; i--) bytes.push((bl / Math.pow(256, i)) & 0xff);
  const rr = (v, n) => (v >>> n) | (v << (32 - n));
  for (let i = 0; i < bytes.length; i += 64) {
    const w = new Array(64);
    for (let j = 0; j < 16; j++)
      w[j] = (bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3];
    for (let j = 16; j < 64; j++) {
      const s0 = rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);
      const s1 = rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);
      w[j] = (w[j-16]+s0+w[j-7]+s1)|0;
    }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let j = 0; j < 64; j++) {
      const t1 = (hh + (rr(e,6)^rr(e,11)^rr(e,25)) + ((e&f)^(~e&g)) + K[j] + w[j])|0;
      const t2 = ((rr(a,2)^rr(a,13)^rr(a,22)) + ((a&b)^(a&c)^(b&c)))|0;
      hh=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h[0]=(h[0]+a)|0; h[1]=(h[1]+b)|0; h[2]=(h[2]+c)|0; h[3]=(h[3]+d)|0;
    h[4]=(h[4]+e)|0; h[5]=(h[5]+f)|0; h[6]=(h[6]+g)|0; h[7]=(h[7]+hh)|0;
  }
  return h.map(v => (v >>> 0).toString(16).padStart(8,'0')).join('');
}

/* ===== NAVIGATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  const toggle  = document.getElementById('nav-toggle');
  const links   = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  function closeNav() {
    toggle && toggle.classList.remove('open');
    links  && links.classList.remove('open');
    overlay && overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openNav() {
    toggle && toggle.classList.add('open');
    links  && links.classList.add('open');
    overlay && overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.contains('open') ? closeNav() : openNav();
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  }
  if (overlay) overlay.addEventListener('click', closeNav);

  // Mark active link
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Back to top
  const bt = document.getElementById('back-top');
  if (bt) {
    window.addEventListener('scroll', () => {
      bt.classList.toggle('visible', window.scrollY > 400);
    });
    bt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Scripture rotation
  rotatescripture();
  setInterval(rotatescripture, 8000);

  // Scroll animations
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animated'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
});

/* ===== SCRIPTURE ROTATION ===== */
const SCRIPTURES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.", ref: "John 3:16" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", ref: "Romans 8:28" },
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "Cast all your anxiety on Him because He cares for you.", ref: "1 Peter 5:7" },
];
let scriptureIndex = 0;
function rotatescripture() {
  const textEl = document.getElementById('scripture-text');
  const refEl  = document.getElementById('scripture-ref');
  if (!textEl) return;
  const s = SCRIPTURES[scriptureIndex % SCRIPTURES.length];
  textEl.style.opacity = '0';
  setTimeout(() => {
    textEl.textContent = s.text;
    if (refEl) refEl.textContent = '— ' + s.ref;
    textEl.style.opacity = '1';
  }, 400);
  textEl.style.transition = 'opacity 0.4s';
  if (refEl) refEl.style.transition = 'opacity 0.4s';
  scriptureIndex++;
}

/* ===== WHATSAPP HELPERS ===== */
function buildWhatsAppLink(message) {
  return `https://wa.me/${MINISTRY_PHONE}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
  window.open(buildWhatsAppLink(message), '_blank');
}

/* ===== PRAYER FORM ===== */
const prayerForm = document.getElementById('prayer-form');
if (prayerForm) {
  prayerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = prayerForm.querySelector('[name=prayer-name]').value.trim();
    const phone   = prayerForm.querySelector('[name=prayer-phone]').value.trim();
    const country = prayerForm.querySelector('[name=prayer-country]').value.trim();
    const request = prayerForm.querySelector('[name=prayer-request]').value.trim();

    if (!name || !request) { showToast('Please fill in your name and prayer request.', true); return; }

    // Save to localStorage for admin
    const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
    const entry = {
      id: Date.now(),
      name, phone, country, request,
      status: 'pending',
      notes: '',
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString()
    };
    prayers.push(entry);
    localStorage.setItem('mj_prayers', JSON.stringify(prayers));

    // Build WhatsApp message
    const msg = `*🙏 PRAYER REQUEST — ${MINISTRY_NAME}*\n\n*Name:* ${name}\n*Phone:* ${phone || 'Not provided'}\n*Country:* ${country || 'Not provided'}\n\n*Prayer Request:*\n${request}\n\n_Submitted via the Ministry Website_`;

    // Ask user what to do
    const choice = document.getElementById('submit-choice').value;
    if (choice === 'whatsapp' || choice === 'both') {
      openWhatsApp(msg);
    }
    showToast('Your prayer request has been submitted! God bless you. 🙏');
    prayerForm.reset();
    if (document.getElementById('audio-preview')) document.getElementById('audio-preview').classList.add('hidden');
  });
}

/* ===== WHATSAPP PRAYER (for non-web users) ===== */
function sendPrayerViaWhatsApp() {
  const msg = `*🙏 PRAYER REQUEST — ${MINISTRY_NAME}*\n\nPlease reply with your prayer request. Include:\n- Your Name\n- Your Country\n- Your Prayer Request\n\nOur team will pray for you. God bless you! 🙏`;
  openWhatsApp(msg);
}

/* ===== TESTIMONY FORM ===== */
const testimonyForm = document.getElementById('testimony-form');
if (testimonyForm) {
  testimonyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = testimonyForm.querySelector('[name=t-name]').value.trim();
    const loc  = testimonyForm.querySelector('[name=t-location]').value.trim();
    const text = testimonyForm.querySelector('[name=t-testimony]').value.trim();
    if (!name || !text) { showToast('Please fill in your name and testimony.', true); return; }

    const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
    testimonies.push({ id: Date.now(), name, location: loc, testimony: text, approved: false, date: new Date().toLocaleDateString('en-GB') });
    localStorage.setItem('mj_testimonies', JSON.stringify(testimonies));

    showToast('Thank you for sharing your testimony! Praise God! 🙌');
    testimonyForm.reset();
  });
}

/* ===== MEMBERSHIP FORM ===== */
const memberForm = document.getElementById('member-form');
if (memberForm) {
  memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(memberForm));
    const members = JSON.parse(localStorage.getItem('mj_members') || '[]');
    members.push({ id: Date.now(), ...data, date: new Date().toLocaleDateString('en-GB') });
    localStorage.setItem('mj_members', JSON.stringify(members));
    showToast('Welcome to the family! Your membership is registered. 🎉');
    memberForm.reset();
  });
}

/* ===== EVENT REGISTRATION ===== */
const eventForm = document.getElementById('event-form');
if (eventForm) {
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(eventForm));
    const msg = `*🎉 EVENT REGISTRATION — ${MINISTRY_NAME}*\n\n*Name:* ${data.name || ''}\n*Phone:* ${data.phone || ''}\n*Email:* ${data.email || ''}\n*Event:* ${data.event || ''}\n*Country:* ${data.country || ''}\n\n_Registered via the Ministry Website_`;
    openWhatsApp(msg);
    showToast('Registration sent! We will contact you shortly. 🎉');
    eventForm.reset();
  });
}

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = contactForm.querySelector('[name=c-name]').value.trim();
    const email   = contactForm.querySelector('[name=c-email]').value.trim();
    const subject = contactForm.querySelector('[name=c-subject]').value.trim();
    const message = contactForm.querySelector('[name=c-message]').value.trim();
    if (!name || !message) { showToast('Please fill in required fields.', true); return; }
    const msg = `*📩 MESSAGE — ${MINISTRY_NAME}*\n\n*From:* ${name}\n*Email:* ${email}\n*Subject:* ${subject}\n\n*Message:*\n${message}\n\n_Sent via Ministry Website_`;
    openWhatsApp(msg);
    showToast('Message sent via WhatsApp! We will reply soon. ✉️');
    contactForm.reset();
  });
}

/* ===== AUDIO RECORDER ===== */
let mediaRecorder, recordedChunks = [], recordingTimer, recordingSeconds = 0;
function startRecording() {
  if (!navigator.mediaDevices) { showToast('Audio recording not supported on this browser.', true); return; }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url  = URL.createObjectURL(blob);
      const audio = document.getElementById('audio-playback');
      if (audio) { audio.src = url; document.getElementById('audio-preview').classList.remove('hidden'); }
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    const btn   = document.getElementById('rec-btn');
    const timer = document.getElementById('rec-timer');
    const stat  = document.getElementById('rec-status');
    if (btn) { btn.innerHTML = '<i class="fas fa-stop"></i>'; btn.classList.add('recording'); btn.onclick = stopRecording; }
    if (stat) stat.textContent = 'Recording... click stop when done';
    recordingSeconds = 0;
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      const m = String(Math.floor(recordingSeconds / 60)).padStart(2,'0');
      const s = String(recordingSeconds % 60).padStart(2,'0');
      if (timer) timer.textContent = `${m}:${s}`;
    }, 1000);
  }).catch(() => showToast('Could not access microphone. Please check permissions.', true));
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(recordingTimer);
    const btn  = document.getElementById('rec-btn');
    const stat = document.getElementById('rec-status');
    if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i>'; btn.classList.remove('recording'); btn.onclick = startRecording; }
    if (stat) stat.textContent = 'Recording saved. You can listen below.';
  }
}

/* ===== COPY TO CLIPBOARD ===== */
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#10b981';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
  });
}

/* ===== TOAST NOTIFICATIONS ===== */
function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.innerHTML = `<i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}" style="color:${isError?'#ef4444':'#10b981'};font-size:1.2rem;"></i> ${message}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 4500);
}

/* ===== LIGHTBOX ===== */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('img').src = src;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) { lb.classList.remove('active'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ===== ADMIN ===== */
function togglePassVisibility() {
  const input = document.getElementById('admin-pass');
  const icon  = document.getElementById('toggle-pass-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

async function adminLogin() {
  const pass = document.getElementById('admin-pass');
  if (!pass) return;
  const entered = hashPassword(pass.value);
  if (entered === ADMIN_PASSWORD_HASH) {
    sessionStorage.setItem('mj_admin', '1');
    document.getElementById('admin-login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadAdminData();
  } else {
    showToast('Incorrect password. Please try again.', true);
    pass.value = '';
  }
}

function adminLogout() {
  sessionStorage.removeItem('mj_admin');
  location.reload();
}

function showAdminSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  const link = document.querySelector(`.admin-nav a[onclick*="${id}"]`);
  if (link) link.classList.add('active');
  const title = document.getElementById('admin-section-title');
  if (title) title.textContent = sec ? sec.dataset.title || id : id;
}

function loadAdminData() {
  const prayers    = JSON.parse(localStorage.getItem('mj_prayers')    || '[]');
  const testimonies = JSON.parse(localStorage.getItem('mj_testimonies')|| '[]');
  const members    = JSON.parse(localStorage.getItem('mj_members')    || '[]');

  // Stats
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-prayers', prayers.length);
  setEl('stat-testimonies', testimonies.length);
  setEl('stat-members', members.length);
  setEl('stat-pending', prayers.filter(p => p.status === 'pending').length);

  // Prayer table
  const pTbl = document.getElementById('prayers-table-body');
  if (pTbl) {
    pTbl.innerHTML = prayers.length ? prayers.slice().reverse().map((p) => `
      <tr id="prayer-row-${p.id}">
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.phone || '-')}</td>
        <td>${escapeHtml(p.country || '-')}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.request)}</td>
        <td><span class="badge badge-${p.status}">${p.status==='pending'?'⏳ Pending':p.status==='praying'?'🙏 Praying':'✅ Completed'}</span></td>
        <td>${escapeHtml(p.date)}</td>
        <td style="white-space:nowrap;">
          <button class="btn-xs btn-xs-blue" onclick="updatePrayerStatus(${p.id},'praying')">🙏 Praying</button>
          <button class="btn-xs btn-xs-green" onclick="updatePrayerStatus(${p.id},'completed')" style="margin-left:4px;">✅ Done</button>
          <button class="btn-xs btn-xs-purple" onclick="whatsappPrayer(${JSON.stringify(p.phone)},${JSON.stringify(p.name)})" style="margin-left:4px;">WhatsApp</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center text-muted">No prayer requests yet.</td></tr>';
  }

  // Testimonies table
  const tTbl = document.getElementById('testimonies-table-body');
  if (tTbl) {
    tTbl.innerHTML = testimonies.length ? testimonies.slice().reverse().map(t => `
      <tr>
        <td><strong>${escapeHtml(t.name)}</strong></td>
        <td>${escapeHtml(t.location || '-')}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.testimony)}</td>
        <td><span class="badge ${t.approved?'badge-completed':'badge-pending'}">${t.approved?'✅ Approved':'⏳ Pending'}</span></td>
        <td>${escapeHtml(t.date)}</td>
        <td>
          <button class="btn-xs btn-xs-green" onclick="approveTestimony(${t.id})">Approve</button>
          <button class="btn-xs btn-xs-red" onclick="deleteTestimony(${t.id})" style="margin-left:4px;">Delete</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">No testimonies yet.</td></tr>';
  }

  // Members table
  const mTbl = document.getElementById('members-table-body');
  if (mTbl) {
    mTbl.innerHTML = members.length ? members.slice().reverse().map(m => `
      <tr>
        <td><strong>${escapeHtml(m['full-name'] || m.name || '-')}</strong></td>
        <td>${escapeHtml(m.email || '-')}</td>
        <td>${escapeHtml(m.phone || '-')}</td>
        <td>${escapeHtml(m.country || '-')}</td>
        <td>${escapeHtml(m.department || '-')}</td>
        <td>${escapeHtml(m.date)}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">No members yet.</td></tr>';
  }
}

function updatePrayerStatus(id, status) {
  const prayers = JSON.parse(localStorage.getItem('mj_prayers') || '[]');
  const idx = prayers.findIndex(p => p.id === id);
  if (idx > -1) { prayers[idx].status = status; localStorage.setItem('mj_prayers', JSON.stringify(prayers)); loadAdminData(); showToast(`Prayer status updated to: ${status}`); }
}
function whatsappPrayer(phone, name) {
  if (!phone) { showToast('No phone number for this person.', true); return; }
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  const msg = `*🙏 Apostle MJ Ministries*\n\nDear ${name},\n\nWe want you to know that our team has been praying for you. God loves you and we believe your prayer has been heard. Stay blessed!\n\n— ${MINISTRY_NAME}`;
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
}
function approveTestimony(id) {
  const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
  const idx = testimonies.findIndex(t => t.id === id);
  if (idx > -1) { testimonies[idx].approved = true; localStorage.setItem('mj_testimonies', JSON.stringify(testimonies)); loadAdminData(); showToast('Testimony approved!'); }
}
function deleteTestimony(id) {
  if (!confirm('Delete this testimony?')) return;
  const testimonies = JSON.parse(localStorage.getItem('mj_testimonies') || '[]');
  localStorage.setItem('mj_testimonies', JSON.stringify(testimonies.filter(t => t.id !== id)));
  loadAdminData(); showToast('Testimony deleted.');
}

// Check admin session
if (window.location.pathname.includes('admin')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('mj_admin') === '1') {
      const ls = document.getElementById('admin-login-screen');
      const db = document.getElementById('admin-dashboard');
      if (ls) ls.classList.add('hidden');
      if (db) { db.classList.remove('hidden'); loadAdminData(); }
    }
    const passInput = document.getElementById('admin-pass');
    if (passInput) passInput.addEventListener('keypress', e => { if (e.key === 'Enter') adminLogin(); });
  });
}

/* =========================================================
   Mathrasathul Husaima — Student Portal — script.js
   Netlify-friendly: no server, all "backend" state lives in
   localStorage; WhatsApp deep links carry real notifications
   to the admin's phone.
   ========================================================= */

/* ---------------- CONFIG ---------------- */
const CONFIG = {
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'admin123',          // change before deploying to production
  ADMIN_WHATSAPP: '94754797973',   // international format, no + or spaces
  SCHOOL_NAME: 'Mathrasathul Husaima'
};

const LS_KEYS = {
  students: 'hs_students',
  gallery: 'hs_gallery',
  events: 'hs_events',
  content: 'hs_content',
  payments: 'hs_payments',
  leaves: 'hs_leaves',
  session: 'hs_session'
};

/* ---------------- STORAGE HELPERS ---------------- */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

/* ---------------- SEED DATA (first run only) ---------------- */
function seedIfEmpty() {
  if (!localStorage.getItem(LS_KEYS.students)) {
    lsSet(LS_KEYS.students, [
      { index: '001', name: 'Mohammed Anas', cls: 'Grade 10 - A', contact: '0771234567' },
      { index: '002', name: 'Fathima Zahra', cls: 'Grade 9 - B', contact: '0779876543' },
      { index: '003', name: 'Abdul Rahman', cls: "Qur'an Hifz", contact: '0765554433' },
      { index: '004', name: 'Mariam Ashraf', cls: 'Grade 11 - A', contact: '0752221100' }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.gallery)) {
    lsSet(LS_KEYS.gallery, [
      { url: '', caption: 'Campus', color: '#0f5f52' },
      { url: '', caption: "Qur'an Circles", color: '#7a2e2e' },
      { url: '', caption: 'Classrooms', color: '#ab8637' },
      { url: '', caption: 'Library', color: '#146b5c' }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.events)) {
    lsSet(LS_KEYS.events, [
      { date: '2026-09-12', title: 'Annual Certificate Ceremony', desc: 'Recognizing academic and Hifz achievements for the year.' },
      { date: '2026-10-03', title: "Qur'an Memorization Competition", desc: 'Open inter-class Hifz competition.' },
      { date: '2026-10-20', title: 'Family & Community Day', desc: 'A day of activities for students and families.' }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.payments)) lsSet(LS_KEYS.payments, []);
  if (!localStorage.getItem(LS_KEYS.leaves)) lsSet(LS_KEYS.leaves, []);
}

/* ---------------- SESSION / AUTH ---------------- */
function getSession() { return lsGet(LS_KEYS.session, { role: 'guest' }); }
function setSession(s) { lsSet(LS_KEYS.session, s); }

function loginStudent(index, password) {
  const students = lsGet(LS_KEYS.students, []);
  const student = students.find(s => s.index === index.trim());
  if (!student) return { ok: false, msg: 'noAccount' };
  if (password.trim() !== student.index) return { ok: false, msg: 'badPass' };
  setSession({ role: 'student', index: student.index, name: student.name });
  return { ok: true };
}

function loginAdmin(user, pass) {
  if (user.trim() === CONFIG.ADMIN_USER && pass.trim() === CONFIG.ADMIN_PASS) {
    setSession({ role: 'admin' });
    return { ok: true };
  }
  return { ok: false };
}

function logout() {
  setSession({ role: 'guest' });
  goTo('home');
  renderShell();
}

/* ---------------- DYNAMIC STUDENT COUNT ---------------- */
function updateHomeStudentCount() {
  const students = lsGet(LS_KEYS.students, []);
  const countElement = document.getElementById('statStudentsCount');
  if (countElement) {
    countElement.textContent = students.length;
  }
}

/* ---------------- NAV CONFIG (RBAC) ---------------- */
const NAV_ITEMS = [
  { id: 'home', ar: 'الرئيسية', en: 'Home', ta: 'முகப்பு', roles: ['guest', 'student', 'admin'] },
  { id: 'about', ar: 'عن المدرسة', en: 'About', ta: 'எங்களைப் பற்றி', roles: ['guest', 'student', 'admin'] },
  { id: 'gallery', ar: 'المعرض', en: 'Gallery', ta: 'தொகுப்பு', roles: ['guest', 'student', 'admin'] },
  { id: 'events', ar: 'الفعاليات', en: 'Event', ta: 'நிகழ்வுகள்', roles: ['guest', 'student', 'admin'] },
  { id: 'admission', ar: 'الالتحاق', en: 'Admission', ta: 'சேர்க்கை', roles: ['guest'] },
  { id: 'leave', ar: 'الإجازة', en: 'Leave Form', ta: 'விடுப்பு', roles: ['student', 'admin'] },
  { id: 'team', ar: 'فريقنا', en: 'Team', ta: 'குழு', roles: ['guest', 'student', 'admin'] },
  { id: 'payment', ar: 'الدفع', en: 'Payment', ta: 'கட்டணம்', roles: ['student', 'admin'] },
  { id: 'contact', ar: 'تواصل معنا', en: 'Contact', ta: 'தொடர்பு', roles: ['guest', 'student', 'admin'] },
  { id: 'dashboard', ar: 'لوحة التحكم', en: 'Dashboard', ta: 'டாஷ்போர்டு', roles: ['admin'] }
];

function renderNav() {
  const session = getSession();
  const nav = document.getElementById('mainNav');
  nav.innerHTML = '';
  NAV_ITEMS.filter(i => i.roles.includes(session.role)).forEach(item => {
    const btn = document.createElement('button');
    btn.dataset.page = item.id;
    btn.onclick = () => goTo(item.id);
    btn.innerHTML = `<span class="i18n ar">${item.ar}</span><span class="i18n en">${item.en}</span><span class="i18n ta">${item.ta}</span>`;
    nav.appendChild(btn);
  });
}

function renderShell() {
  const session = getSession();
  renderNav();

  const loginBtn = document.getElementById('loginNavBtn');
  const roleBarAdmin = document.getElementById('adminBar');
  const roleBarStudent = document.getElementById('studentBar');
  roleBarAdmin.classList.remove('active');
  roleBarStudent.classList.remove('active');

  if (session.role === 'admin') {
    loginBtn.style.display = 'none';
    roleBarAdmin.classList.add('active');
  } else if (session.role === 'student') {
    loginBtn.style.display = 'none';
    roleBarStudent.classList.add('active');
    document.getElementById('studentBarName').textContent = session.name + ' (' + session.index + ')';
  } else {
    loginBtn.style.display = 'inline-flex';
  }

  // guard current page against role change
  const current = document.querySelector('.page.active');
  if (current) {
    const id = current.id.replace('page-', '');
    const navItem = NAV_ITEMS.find(n => n.id === id);
    if (navItem && !navItem.roles.includes(session.role)) goTo('home');
  }
}

/* ---------------- LANGUAGE ---------------- */
function setLang(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  lsSet('hs_lang', lang);
}

/* ---------------- ROUTING ---------------- */
function goTo(page) {
  const session = getSession();
  const navItem = NAV_ITEMS.find(n => n.id === page) || { roles: ['guest', 'student', 'admin'] };
  if (page !== 'login' && !navItem.roles.includes(session.role)) {
    page = 'login';
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('nav.main button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.getElementById('mainNav').classList.remove('open');
  window.scrollTo({ top: 0, behavior: document.body.classList.contains('anim-off') ? 'auto' : 'smooth' });
  if (page === 'payment') renderStudentPayments();
  if (page === 'leave') prefillLeaveForm();
  if (page === 'dashboard') renderDashboard();
  if (page === 'home') updateHomeStudentCount();
}

/* ---------------- ANIMATION TOGGLE ---------------- */
function toggleAnim() {
  document.body.classList.toggle('anim-off');
  document.getElementById('animSwitch').classList.toggle('off');
}

/* ---------------- SCROLL REVEAL ---------------- */
let io;
function initReveal() {
  io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ---------------- TOAST ---------------- */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------------- LOGIN FORM HANDLERS ---------------- */
function switchLoginTab(kind) {
  document.getElementById('tabStudentLogin').classList.toggle('active', kind === 'student');
  document.getElementById('tabAdminLogin').classList.toggle('active', kind === 'admin');
  document.getElementById('studentLoginForm').style.display = kind === 'student' ? 'block' : 'none';
  document.getElementById('adminLoginForm').style.display = kind === 'admin' ? 'block' : 'none';
}

function submitStudentLogin(e) {
  e.preventDefault();
  const idx = document.getElementById('stuLoginIndex').value;
  const pass = document.getElementById('stuLoginPass').value;
  const r = loginStudent(idx, pass);
  if (r.ok) {
    toast('Welcome back!');
    renderShell();
    goTo('home');
    e.target.reset();
  } else {
    alert(r.msg === 'noAccount'
      ? 'No student found with that Index Number. Contact admin.'
      : 'Incorrect password. Your password is the same as your Index Number.');
  }
  return false;
}

function submitAdminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('adminLoginUser').value;
  const p = document.getElementById('adminLoginPass').value;
  const r = loginAdmin(u, p);
  if (r.ok) {
    renderShell();
    goTo('dashboard');
    e.target.reset();
  } else {
    alert('Invalid admin credentials.');
  }
  return false;
}

/* ---------------- WHATSAPP HELPERS ---------------- */
function openWhatsApp(message) {
  const url = `https://wa.me/${CONFIG.ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/* ---------------- LEAVE FORM ---------------- */
function prefillLeaveForm() {
  const session = getSession();
  if (session.role !== 'student') return;
  document.getElementById('leaveName').value = session.name;
  document.getElementById('leaveIndex').value = session.index;
}

function submitLeaveForm(e) {
  e.preventDefault();
  const session = getSession();
  if (session.role !== 'student') { goTo('login'); return false; }
  const name = document.getElementById('leaveName').value.trim();
  const index = document.getElementById('leaveIndex').value.trim();
  const date = document.getElementById('leaveDate').value;
  const reason = document.getElementById('leaveReason').value.trim();
  if (!date || !reason) { alert('Please fill in the date and reason.'); return false; }

  const record = { id: 'LV-' + Date.now(), name, index, date, reason, submittedAt: new Date().toISOString() };
  const leaves = lsGet(LS_KEYS.leaves, []);
  leaves.unshift(record);
  lsSet(LS_KEYS.leaves, leaves);

  const msg =
`*LEAVE REQUEST — ${CONFIG.SCHOOL_NAME}*
Student Name: ${name}
Index Number: ${index}
Leave Date: ${date}
Reason: ${reason}

Sent automatically via the student portal.`;
  openWhatsApp(msg);
  toast('Leave request sent to admin on WhatsApp.');
  e.target.reset();
  prefillLeaveForm();
  return false;
}

/* ---------------- PAYMENTS ---------------- */
function genReceiptId() { return 'MH-RCPT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000); }

function submitPaymentForm(e) {
  e.preventDefault();
  const session = getSession();
  if (session.role !== 'student') { goTo('login'); return false; }

  const mode = document.querySelector('input[name="payMode"]:checked').value;
  const fee = document.getElementById('payFee').value.trim();
  const date = document.getElementById('payDate').value;
  const parent = document.getElementById('payParent').value.trim();

  if (!fee || !date || !parent) { alert('Please complete all fields.'); return false; }

  const record = {
    id: genReceiptId(),
    studentIndex: session.index,
    studentName: session.name,
    parent, fee, date, mode,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const payments = lsGet(LS_KEYS.payments, []);
  payments.unshift(record);
  lsSet(LS_KEYS.payments, payments);

  const msg =
`*PAYMENT REQUEST — ${CONFIG.SCHOOL_NAME}*
Receipt Ref: ${record.id}
Student Name: ${record.studentName}
Index Number: ${record.studentIndex}
Parent Name: ${parent}
Fee Amount: LKR ${fee}
Date: ${date}
Mode: ${mode.toUpperCase()}

Please CONFIRM this payment in the Admin Dashboard.
Reply YES to confirm or NO to reject.`;
  openWhatsApp(msg);
  toast('Payment request sent — awaiting admin confirmation.');
  e.target.reset();
  renderStudentPayments();
  return false;
}

function renderStudentPayments() {
  const session = getSession();
  const wrap = document.getElementById('myPaymentsList');
  if (!wrap) return;
  if (session.role !== 'student') { wrap.innerHTML = ''; return; }
  const payments = lsGet(LS_KEYS.payments, []).filter(p => p.studentIndex === session.index);
  if (!payments.length) {
    wrap.innerHTML = `<p class="empty-note">
      <span class="i18n ar">لا توجد طلبات دفع بعد.</span>
      <span class="i18n en">No payment requests yet.</span>
      <span class="i18n ta">இதுவரை கட்டண கோரிக்கை இல்லை.</span></p>`;
    return;
  }
  wrap.innerHTML = payments.map(p => `
    <div class="crud-row" style="grid-template-columns: 1fr 1fr 1fr auto;">
      <div><b>${p.id}</b><br><span style="font-size:.75rem;color:var(--text-sub)">${p.date}</span></div>
      <div>LKR ${p.fee}</div>
      <div>${p.mode.toUpperCase()}</div>
      <div style="display:flex;align-items:center;gap:.6rem;">
        <span class="badge ${p.status}">${p.status}</span>
        ${p.status === 'confirmed' ? `<button class="btn btn-gold btn-sm" onclick="openReceipt('${p.id}')">View Receipt</button>` : ''}
      </div>
    </div>`).join('');
}

function setPaymentStatus(id, status) {
  const payments = lsGet(LS_KEYS.payments, []);
  const p = payments.find(x => x.id === id);
  if (!p) return;
  p.status = status;
  p.decidedAt = new Date().toISOString();
  lsSet(LS_KEYS.payments, payments);
  renderDashboard();
  toast('Payment ' + status + '.');
}

function openReceipt(id) {
  const payments = lsGet(LS_KEYS.payments, []);
  const p = payments.find(x => x.id === id);
  if (!p || p.status !== 'confirmed') return;
  document.getElementById('rcptId').textContent = p.id;
  document.getElementById('rcptName').textContent = p.studentName;
  document.getElementById('rcptIndex').textContent = p.studentIndex;
  document.getElementById('rcptParent').textContent = p.parent;
  document.getElementById('rcptDate').textContent = p.date;
  document.getElementById('rcptMode').textContent = p.mode.toUpperCase();
  document.getElementById('rcptFee').textContent = 'LKR ' + p.fee;
  document.getElementById('receiptModal').dataset.currentId = p.id;
  document.getElementById('receiptModal').classList.add('open');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function downloadReceiptPdf() {
  const id = document.getElementById('receiptModal').dataset.currentId;
  const payments = lsGet(LS_KEYS.payments, []);
  const p = payments.find(x => x.id === id);
  if (!p) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });

  doc.setFillColor(3, 18, 16);
  doc.rect(0, 0, 420, 595, 'F');
  doc.setTextColor(0, 245, 212);
  doc.setFontSize(18);
  doc.text(CONFIG.SCHOOL_NAME, 210, 60, { align: 'center' });
  doc.setTextColor(255, 215, 0);
  doc.setFontSize(11);
  doc.text('OFFICIAL PAYMENT RECEIPT', 210, 82, { align: 'center' });

  doc.setDrawColor(255, 215, 0);
  doc.line(40, 100, 380, 100);

  doc.setTextColor(240, 253, 244);
  doc.setFontSize(10);
  const rows = [
    ['Receipt Ref', p.id],
    ['Student Name', p.studentName],
    ['Index Number', p.studentIndex],
    ['Parent Name', p.parent],
    ['Payment Mode', p.mode.toUpperCase()],
    ['Date', p.date],
    ['Status', 'CONFIRMED']
  ];
  let y = 130;
  rows.forEach(r => {
    doc.setTextColor(148, 163, 184);
    doc.text(r[0], 50, y);
    doc.setTextColor(240, 253, 244);
    doc.text(String(r[1]), 220, y);
    y += 26;
  });

  doc.setTextColor(255, 215, 0);
  doc.setFontSize(22);
  doc.text('LKR ' + p.fee, 210, y + 30, { align: 'center' });

  doc.setDrawColor(0, 245, 212);
  doc.line(40, y + 55, 380, y + 55);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('This is a system-generated receipt. Keep it for your records.', 210, y + 75, { align: 'center' });
  doc.text('Website Creator: Mohammed Rasith (mohammedrasith27@gmail.com)', 210, y + 90, { align: 'center' });

  doc.save(p.id + '.pdf');
}

async function shareReceipt() {
  const id = document.getElementById('receiptModal').dataset.currentId;
  const payments = lsGet(LS_KEYS.payments, []);
  const p = payments.find(x => x.id === id);
  if (!p) return;
  const text = `Payment Receipt ${p.id} — ${p.studentName} (${p.studentIndex}) — LKR ${p.fee} — CONFIRMED — ${CONFIG.SCHOOL_NAME}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Payment Receipt', text }); return; } catch (e) { /* fall through */ }
  }
  openWhatsApp(text);
}

/* ---------------- ADMISSION / CONTACT FORMS ---------------- */
function submitAdmissionForm(e) {
  e.preventDefault();
  toast('Admission form submitted. We will contact you soon.');
  const name = document.getElementById('admName')?.value || '';
  const msg = `*NEW ADMISSION ENQUIRY — ${CONFIG.SCHOOL_NAME}*\nName: ${name}\nSubmitted via the website.`;
  openWhatsApp(msg);
  e.target.reset();
  return false;
}
function submitContactForm(e) {
  e.preventDefault();
  toast('Message sent. Thank you!');
  e.target.reset();
  return false;
}

/* ---------------- PUBLIC RENDER: GALLERY / EVENTS ---------------- */
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const data = lsGet(LS_KEYS.gallery, []);
  grid.innerHTML = '';
  if (!data.length) { grid.innerHTML = `<p class="empty-note i18n en">No photos yet.</p>`; return; }
  data.forEach(g => {
    const div = document.createElement('div');
    div.className = 'gtile reveal';
    div.style.background = g.url
      ? `url('${g.url}') center/cover`
      : `linear-gradient(135deg, ${g.color || '#0f5f52'}, rgba(0,245,212,.35))`;
    div.innerHTML = `<span>${g.caption}</span>`;
    grid.appendChild(div);
    io && io.observe(div);
  });
}

function renderEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;
  const data = lsGet(LS_KEYS.events, []).slice().sort((a, b) => a.date.localeCompare(b.date));
  list.innerHTML = '';
  if (!data.length) { list.innerHTML = `<p class="empty-note i18n en">No upcoming events.</p>`; return; }
  data.forEach(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    const day = isNaN(d) ? '--' : String(d.getDate()).padStart(2, '0');
    const mon = isNaN(d) ? '' : d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `<div class="event-date"><b>${day}</b>${mon}</div>
      <div><h4 style="font-size:1.02rem;">${ev.title}</h4><div class="event-desc">${ev.desc || ''}</div></div>`;
    list.appendChild(row);
  });
}

/* ---------------- ADMIN DASHBOARD ---------------- */
function switchDashTab(tab) {
  document.querySelectorAll('.dash-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.dash-pane').forEach(p => p.classList.toggle('active', p.id === 'dash-' + tab));
}

function renderDashboard() {
  if (getSession().role !== 'admin') return;
  renderDashStudents();
  renderDashGallery();
  renderDashEvents();
  renderDashPayments();
  renderDashLeaves();
}

/* -- Students CRUD -- */
function renderDashStudents() {
  const wrap = document.getElementById('dashStudentsList');
  if (!wrap) return;
  const students = lsGet(LS_KEYS.students, []);
  wrap.innerHTML = students.map((s, i) => `
    <div class="crud-row">
      <div><b>${s.index}</b><br><span style="font-size:.72rem;color:var(--text-sub)">login = index</span></div>
      <div>${s.name}</div>
      <div>${s.cls || '—'}</div>
      <div>${s.contact || '—'}</div>
      <div class="crud-actions">
        <button class="icon-btn" title="Edit" onclick="editStudent(${i})">✏️</button>
        <button class="icon-btn danger" title="Delete" onclick="deleteStudent(${i})">🗑️</button>
      </div>
    </div>`).join('') || `<p class="empty-note">No students yet.</p>`;
}
function addStudent(e) {
  e.preventDefault();
  const index = document.getElementById('newStuIndex').value.trim();
  const name = document.getElementById('newStuName').value.trim();
  const cls = document.getElementById('newStuClass').value.trim();
  const contact = document.getElementById('newStuContact').value.trim();
  if (!index || !name) { alert('Index number and name are required.'); return false; }
  const students = lsGet(LS_KEYS.students, []);
  if (students.some(s => s.index === index)) { alert('That index number already exists.'); return false; }
  students.push({ index, name, cls, contact });
  lsSet(LS_KEYS.students, students);
  renderDashStudents();
  updateHomeStudentCount(); // மாணவர் எண்ணிக்கை முகப்புப் பக்கத்தில் உடனே மாற
  e.target.reset();
  toast('Student added. Login = index number for both fields.');
  return false;
}
function editStudent(i) {
  const students = lsGet(LS_KEYS.students, []);
  const s = students[i];
  const name = prompt('Full name:', s.name);
  if (name === null) return;
  const cls = prompt('Class / Dept:', s.cls || '');
  const contact = prompt('Contact number:', s.contact || '');
  students[i] = { ...s, name: name.trim() || s.name, cls, contact };
  lsSet(LS_KEYS.students, students);
  renderDashStudents();
  updateHomeStudentCount();
}
function deleteStudent(i) {
  const students = lsGet(LS_KEYS.students, []);
  if (!confirm(`Delete student ${students[i].name} (${students[i].index})?`)) return;
  students.splice(i, 1);
  lsSet(LS_KEYS.students, students);
  renderDashStudents();
  updateHomeStudentCount(); // மாணவரை நீக்கிய பின் எண்ணிக்கையை குறைக்க
}

/* -- Gallery CRUD -- */
function renderDashGallery() {
  const wrap = document.getElementById('dashGalleryList');
  if (!wrap) return;
  const data = lsGet(LS_KEYS.gallery, []);
  wrap.innerHTML = data.map((g, i) => `
    <div class="crud-row" style="grid-template-columns:1fr 2fr auto;">
      <div style="width:100%;height:44px;border-radius:8px;background:${g.url ? `url('${g.url}') center/cover` : g.color};"></div>
      <div>${g.caption}</div>
      <div class="crud-actions">
        <button class="icon-btn danger" onclick="deleteGalleryItem(${i})">🗑️</button>
      </div>
    </div>`).join('') || `<p class="empty-note">No photos yet.</p>`;
}
function addGalleryItem(e) {
  e.preventDefault();
  const url = document.getElementById('newGalUrl').value.trim();
  const caption = document.getElementById('newGalCaption').value.trim();
  if (!caption) { alert('Please add a caption.'); return false; }
  const data = lsGet(LS_KEYS.gallery, []);
  const palette = ['#0f5f52', '#7a2e2e', '#ab8637', '#146b5c'];
  data.push({ url, caption, color: palette[data.length % palette.length] });
  lsSet(LS_KEYS.gallery, data);
  renderDashGallery(); renderGallery();
  e.target.reset();
  toast('Photo added to gallery.');
  return false;
}
function deleteGalleryItem(i) {
  const data = lsGet(LS_KEYS.gallery, []);
  data.splice(i, 1);
  lsSet(LS_KEYS.gallery, data);
  renderDashGallery(); renderGallery();
}

/* -- Events CRUD -- */
function renderDashEvents() {
  const wrap = document.getElementById('dashEventsList');
  if (!wrap) return;
  const data = lsGet(LS_KEYS.events, []);
  wrap.innerHTML = data.map((ev, i) => `
    <div class="crud-row" style="grid-template-columns:1fr 2fr auto;">
      <div>${ev.date}</div>
      <div><b>${ev.title}</b><br><span style="font-size:.75rem;color:var(--text-sub)">${ev.desc || ''}</span></div>
      <div class="crud-actions">
        <button class="icon-btn" onclick="editEvent(${i})">✏️</button>
        <button class="icon-btn danger" onclick="deleteEvent(${i})">🗑️</button>
      </div>
    </div>`).join('') || `<p class="empty-note">No events yet.</p>`;
}
function addEvent(e) {
  e.preventDefault();
  const date = document.getElementById('newEvDate').value;
  const title = document.getElementById('newEvTitle').value.trim();
  const desc = document.getElementById('newEvDesc').value.trim();
  if (!date || !title) { alert('Date and title are required.'); return false; }
  const data = lsGet(LS_KEYS.events, []);
  data.push({ date, title, desc });
  lsSet(LS_KEYS.events, data);
  renderDashEvents(); renderEvents();
  e.target.reset();
  toast('Event added.');
  return false;
}
function editEvent(i) {
  const data = lsGet(LS_KEYS.events, []);
  const ev = data[i];
  const date = prompt('Date (YYYY-MM-DD):', ev.date);
  if (date === null) return;
  const title = prompt('Title:', ev.title);
  const desc = prompt('Description:', ev.desc || '');
  data[i] = { date: date || ev.date, title: title || ev.title, desc };
  lsSet(LS_KEYS.events, data);
  renderDashEvents(); renderEvents();
}
function deleteEvent(i) {
  const data = lsGet(LS_KEYS.events, []);
  if (!confirm('Delete this event?')) return;
  data.splice(i, 1);
  lsSet(LS_KEYS.events, data);
  renderDashEvents(); renderEvents();
}

/* -- Payments (approve / reject) -- */
function renderDashPayments() {
  const wrap = document.getElementById('dashPaymentsList');
  if (!wrap) return;
  const data = lsGet(LS_KEYS.payments, []);
  wrap.innerHTML = data.map(p => `
    <div class="crud-row" style="grid-template-columns:1fr 1fr 1fr 1fr auto;">
      <div><b>${p.id}</b><br><span style="font-size:.72rem;color:var(--text-sub)">${p.date}</span></div>
      <div>${p.studentName}<br><span class="id-tag">${p.studentIndex}</span></div>
      <div>LKR ${p.fee}<br><span style="font-size:.72rem;color:var(--text-sub)">${p.mode.toUpperCase()}</span></div>
      <div><span class="badge ${p.status}">${p.status}</span></div>
      <div class="crud-actions">
        ${p.status === 'pending' ? `
          <button class="icon-btn ok" title="Confirm" onclick="setPaymentStatus('${p.id}','confirmed')">✔️</button>
          <button class="icon-btn danger" title="Reject" onclick="setPaymentStatus('${p.id}','rejected')">✖️</button>` : ''}
      </div>
    </div>`).join('') || `<p class="empty-note">No payment requests yet.</p>`;
}

/* -- Leave requests (read-only log) -- */
function renderDashLeaves() {
  const wrap = document.getElementById('dashLeavesList');
  if (!wrap) return;
  const data = lsGet(LS_KEYS.leaves, []);
  wrap.innerHTML = data.map(l => `
    <div class="crud-row" style="grid-template-columns:1fr 1fr 1fr 2fr;">
      <div>${l.name}</div>
      <div class="id-tag">${l.index}</div>
      <div>${l.date}</div>
      <div>${l.reason}</div>
    </div>`).join('') || `<p class="empty-note">No leave requests yet.</p>`;
}

/* -- Content editor (reuses inline contenteditable, like the original site) -- */
let isEditMode = false;
function toggleInlineEdit() {
  if (getSession().role !== 'admin') return;
  isEditMode = !isEditMode;
  const btn = document.getElementById('editToggleBtn');
  btn.textContent = isEditMode ? '❌ Disable Live Editing' : '✏️ Enable Live Editing';
  document.body.classList.toggle('editable-active', isEditMode);
  document.querySelectorAll('h1,h2,h3,h4,p,span.i18n,b,td,small').forEach(el => {
    if (!el.closest('.role-bar') && !el.closest('script') && !el.closest('.modal-overlay')) {
      el.contentEditable = isEditMode;
    }
  });
  if (isEditMode) alert('Live editing is ON. Click any text on the site to edit it, then press "Save Content".');
}
function saveAllEdits() {
  if (getSession().role !== 'admin') return;
  const content = document.getElementById('mainContainer').innerHTML;
  lsSet(LS_KEYS.content, content);
  toast('Content saved.');
}
function loadSavedEdits() {
  const saved = lsGet(LS_KEYS.content, null);
  if (saved) document.getElementById('mainContainer').innerHTML = saved;
}
function resetContent() {
  if (!confirm('Reset all edited content back to defaults? This cannot be undone.')) return;
  localStorage.removeItem(LS_KEYS.content);
  location.reload();
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  loadSavedEdits();
  setLang(lsGet('hs_lang', 'en'));
  renderShell();
  renderGallery();
  renderEvents();
  initReveal();
  updateHomeStudentCount(); // பக்கம் லோட் ஆகும் போது மாணவர் எண்ணிக்கையை அப்டேட் செய்ய
  goTo('home');
});

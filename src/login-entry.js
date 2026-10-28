// The public sign-in page uses the same prerendered form without loading the SPA.
import { getRoleLandingPath } from './utils/roleAccess';
import { clearLoginCache, sessionUser } from './utils/loginSession';

const form = document.querySelector('form[aria-label="Masuk ke ONE Creativa"]');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submit = form.querySelector('button[type="submit"]');
const passwordToggle = form.querySelector('button[aria-pressed]');
let pending = false;

function showError(message) {
  let alert = document.getElementById('login-error');
  if (!alert) {
    alert = document.createElement('div');
    alert.id = 'login-error';
    alert.setAttribute('role', 'alert');
    alert.className = 'bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold rounded-xl p-4';
    form.prepend(alert);
  }
  alert.textContent = message;
  email.setAttribute('aria-describedby', alert.id);
  password.setAttribute('aria-describedby', alert.id);
}

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Sembunyikan password' : 'Tampilkan password');
  passwordToggle.querySelector('svg')?.setAttribute('aria-hidden', 'true');
});

for (const button of document.querySelectorAll('[data-login-slide-button]')) {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.loginSlideButton);
    document.querySelector('[data-login-slides]').style.transform = `translateX(-${index * 100}%)`;
    for (const slide of document.querySelectorAll('[data-login-slide]')) slide.setAttribute('aria-hidden', String(Number(slide.dataset.loginSlide) !== index));
    for (const dot of document.querySelectorAll('[data-login-slide-button]')) {
      const selected = dot === button;
      dot.setAttribute('aria-pressed', String(selected));
      for (const name of ['w-8', 'bg-white']) dot.classList.toggle(name, selected);
      for (const name of ['w-2.5', 'bg-white/30']) dot.classList.toggle(name, !selected);
    }
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  pending = true;
  submit.disabled = true;
  submit.textContent = 'Sedang masuk...';
  submit.setAttribute('aria-label', 'Sedang masuk');
  form.setAttribute('aria-busy', 'true');
  document.getElementById('login-error')?.remove();
  email.removeAttribute('aria-describedby');
  password.removeAttribute('aria-describedby');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/login.php', { method: 'POST', credentials: 'same-origin', signal: controller.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: email.value, password: password.value }) });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('Respons server login tidak valid. Coba lagi atau hubungi admin.'); }
    if (!response.ok || data.status !== 'success' || !data.user?.id) throw new Error(data.message || 'Email atau password tidak valid.');
    localStorage.setItem('user', JSON.stringify(data.user));
    const fallback = getRoleLandingPath(data.user.role_name);
    const requested = new URLSearchParams(location.search).get('redirect');
    let target;
    try { target = new URL(requested || fallback, location.origin); }
    catch { target = new URL(fallback, location.origin); }
    const safe = requested?.startsWith('/') && target.origin === location.origin && !['/home', '/login', '/'].includes(target.pathname);
    location.assign(safe ? target.pathname + target.search + target.hash : fallback);
  } catch (error) {
    showError(error.name === 'AbortError' ? 'Koneksi ke server terlalu lama. Coba lagi.' : error.message || 'Koneksi ke server gagal. Coba lagi.');
  } finally {
    clearTimeout(timer);
    pending = false;
    submit.disabled = false;
    submit.textContent = 'Masuk Sekarang';
    submit.setAttribute('aria-label', 'Masuk Sekarang');
    form.setAttribute('aria-busy', 'false');
  }
});
// The prerendered submit stays disabled until its handler is ready.
submit.disabled = false;

if (localStorage.getItem('user')) {
  fetch('/api/session.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(async response => {
    if (pending) return;
    if (response.status === 401) { clearLoginCache(); return; }
    if (response.ok && !pending) location.replace(getRoleLandingPath(sessionUser(await response.json()).role_name));
  }).catch(() => { /* Keep sign-in available when session verification is offline. */ });
}

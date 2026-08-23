import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const root = document.getElementById('root');
const AUTH_TIMEOUT_MS = 12000;
const APP_LOAD_TIMEOUT_MS = 8000;
let booting = false;
let appLoaded = false;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

function withTimeout(promise, ms, message = 'La solicitud tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function ensureLightStartup() {
  try {
    const raw = localStorage.getItem('r17-settings-v1');
    if (!raw) {
      localStorage.setItem('r17-settings-v1', JSON.stringify({ theme: 'light' }));
    }
  } catch { /* localStorage can be unavailable in private contexts */ }
  document.documentElement.dataset.r17Theme = 'light';
  document.documentElement.style.colorScheme = 'light';
}

function renderLogin(message = '') {
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand"><div class="auth-mark">R17</div><div><strong>Regional 17</strong><span>Sistema de evaluación</span></div></div>
        <div class="auth-kicker">ACCESO PRIVADO</div>
        <h1>Iniciar sesión</h1>
        <p class="auth-copy">Accede como coordinador, evaluador o Master Admin.</p>
        ${message ? `<div class="auth-message">${escapeHtml(message)}</div>` : ''}
        <form id="login-form">
          <label>Correo electrónico<input id="email" type="email" autocomplete="email" required placeholder="tu-correo@ejemplo.com" /></label>
          <label>Contraseña<input id="password" type="password" autocomplete="current-password" required placeholder="••••••••" /></label>
          <button id="login-btn" type="submit">Entrar</button>
        </form>
        <div class="auth-divider"><span>o</span></div>
        <button id="magic-btn" type="button" class="auth-secondary">Enviar enlace de acceso</button>
        <small class="auth-foot">Acceso protegido por Supabase Auth y roles de la base de datos.</small>
      </div>
    </div>`;

  const form = document.getElementById('login-form');
  const magicBtn = document.getElementById('magic-btn');
  if (!form || !magicBtn) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) return renderLogin('Supabase no está configurado en este deployment.');
    if (booting || appLoaded) return;

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    setBusy('login-btn', true, 'Verificando…');

    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
        'Supabase no respondió a tiempo. Revisa Vercel y las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
      );
      if (result.error) throw result.error;
      if (!result.data?.session) throw new Error('Supabase autenticó la solicitud, pero no devolvió una sesión.');

      setBusy('login-btn', true, 'Cargando sistema…');
      await mountApplication();
    } catch (error) {
      console.error('Login error:', error);
      booting = false;
      renderLogin(error?.message || 'No se pudo iniciar sesión.');
    }
  });

  magicBtn.addEventListener('click', async () => {
    if (!isSupabaseConfigured || !supabase) return renderLogin('Supabase no está configurado en este deployment.');
    const email = document.getElementById('email').value.trim().toLowerCase();
    if (!email) return renderLogin('Escribe primero tu correo electrónico.');
    setBusy('magic-btn', true, 'Enviando…');
    try {
      const result = await withTimeout(
        supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } }),
        AUTH_TIMEOUT_MS,
        'Supabase no respondió a tiempo al enviar el enlace.'
      );
      renderLogin(result.error ? result.error.message : 'Revisa tu correo. Si tu cuenta ya está autorizada, encontrarás el enlace para entrar.');
    } catch (error) {
      renderLogin(error?.message || 'No se pudo enviar el enlace.');
    }
  });
}

function setBusy(id, busy, label) {
  const button = document.getElementById(id);
  if (button) {
    button.disabled = busy;
    if (label) button.textContent = label;
  }
}

async function mountApplication() {
  if (appLoaded || booting) return;
  booting = true;
  root.setAttribute('aria-busy', 'true');
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-kicker">REGIONAL 17</div>
        <h1>Cargando sistema…</h1>
        <p class="auth-copy">Estamos preparando tu panel de evaluación.</p>
      </div>
    </div>`;

  try {
    await withTimeout(
      import('./main.jsx'),
      APP_LOAD_TIMEOUT_MS,
      'La interfaz no terminó de cargar. Abre la consola del navegador para ver el error de JavaScript.'
    );

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (!root.querySelector('.app-shell')) {
      throw new Error('React cargó, pero el panel no se montó en #root.');
    }

    appLoaded = true;
    root.removeAttribute('aria-busy');
  } catch (error) {
    console.error('Error loading application:', error);
    root.innerHTML = `
      <div class="auth-shell">
        <div class="auth-card">
          <div class="auth-kicker">ERROR DE CARGA</div>
          <h1>No se pudo abrir el panel</h1>
          <p class="auth-copy">La sesión de Supabase es válida, pero la interfaz no pudo iniciar.</p>
          <div class="auth-message">${escapeHtml(error?.message || 'Error desconocido al cargar la aplicación.')}</div>
          <button id="retry-btn" type="button">Reintentar</button>
        </div>
      </div>`;
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      appLoaded = false;
      booting = false;
      mountApplication();
    });
    root.setAttribute('aria-busy', 'false');
  } finally {
    booting = false;
  }
}

async function boot() {
  ensureLightStartup();

  if (!isSupabaseConfigured || !supabase) {
    renderLogin('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.');
    return;
  }

  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      AUTH_TIMEOUT_MS,
      'No se pudo comprobar la sesión con Supabase.'
    );
    if (result.error) throw result.error;
    const session = result.data?.session || null;

    if (!session) {
      renderLogin();
      return;
    }

    await mountApplication();
  } catch (error) {
    console.error('Authentication bootstrap error:', error);
    renderLogin(error?.message || 'No se pudo completar el acceso al sistema.');
  }
}

supabase?.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    appLoaded = false;
    booting = false;
    ensureLightStartup();
    renderLogin();
  }
});

boot();

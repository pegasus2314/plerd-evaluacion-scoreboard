import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const root = document.getElementById('root');
const AUTHORIZED_ROLES = ['master_admin', 'coordinator', 'evaluator'];
const AUTH_TIMEOUT_MS = 10000;
let booting = false;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

function withTimeout(promise, label = 'La solicitud tardó demasiado. No se pudo completar el acceso.') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), AUTH_TIMEOUT_MS); })
  ]).finally(() => clearTimeout(timer));
}

function renderLogin(message = '') {
  booting = false;
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
    if (booting) return;
    if (!isSupabaseConfigured || !supabase) return renderLogin('Supabase no está configurado en este deployment.');

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    setBusy('login-btn', true, 'Verificando…');

    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        'La conexión con Supabase tardó demasiado. Revisa la configuración de Vercel y vuelve a intentarlo.'
      );
      if (result.error) throw result.error;
      if (!result.data?.session) throw new Error('Supabase autenticó la solicitud, pero no devolvió una sesión.');
      await boot(result.data.session);
    } catch (error) {
      console.error('Login error:', error);
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
        'La solicitud tardó demasiado. Revisa la conexión con Supabase.'
      );
      renderLogin(result.error ? result.error.message : 'Revisa tu correo. Si tu cuenta ya está autorizada, encontrarás el enlace para entrar.');
    } catch (error) {
      renderLogin(error?.message || 'No se pudo enviar el enlace de acceso.');
    }
  });
}

function setBusy(id, busy, label) {
  const button = document.getElementById(id);
  if (button) { button.disabled = busy; if (label) button.textContent = label; }
}

async function boot(existingSession = null) {
  if (booting) return;
  booting = true;

  try {
    if (!isSupabaseConfigured || !supabase) {
      renderLogin('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.');
      return;
    }

    let session = existingSession;
    if (!session) {
      const result = await withTimeout(supabase.auth.getSession(), 'No se pudo comprobar la sesión con Supabase.');
      if (result.error) throw result.error;
      session = result.data?.session || null;
    }

    if (!session) {
      renderLogin();
      return;
    }

    const result = await withTimeout(
      supabase.from('staff_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
      'La sesión existe, pero no se pudo comprobar tu rol. Revisa las políticas de acceso de staff_roles en Supabase.'
    );
    if (result.error) throw result.error;

    const staff = result.data;
    if (!staff || !AUTHORIZED_ROLES.includes(staff.role)) {
      try { await withTimeout(supabase.auth.signOut(), 'No se pudo cerrar la sesión.'); } catch {}
      renderLogin('Tu cuenta está autenticada, pero todavía no tiene un rol autorizado.');
      return;
    }

    setBusy('login-btn', true, 'Cargando sistema…');
    await withTimeout(
      import('./main.jsx'),
      'La sesión es válida, pero la aplicación tardó demasiado en cargarse. Recarga la página e inténtalo de nuevo.'
    );
  } catch (error) {
    console.error('Authentication bootstrap error:', error);
    renderLogin(error?.message || 'No se pudo completar el acceso al sistema.');
  } finally {
    booting = false;
  }
}

// El login se controla desde un único flujo. No se vuelve a ejecutar boot()
// desde SIGNED_IN, evitando carreras entre el formulario y el listener de Auth.
boot();

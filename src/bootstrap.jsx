import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const root = document.getElementById('root');
const AUTHORIZED_ROLES = ['master_admin', 'coordinator', 'evaluator'];
const AUTH_TIMEOUT_MS = 10000;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

function withTimeout(promise, label = 'La solicitud tardó demasiado. No se pudo completar el acceso.') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label)), AUTH_TIMEOUT_MS))
  ]);
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
        <button id="magic-btn" class="auth-secondary">Enviar enlace de acceso</button>
        <small class="auth-foot">Acceso protegido por Supabase Auth y roles de la base de datos.</small>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!supabase) return renderLogin('Supabase no está configurado en este deployment.');
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    setBusy('login-btn', true, 'Verificando…');
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        'La conexión con Supabase tardó demasiado. Revisa la configuración de Vercel y vuelve a intentarlo.'
      );
      const { data, error } = result;
      if (error) throw error;
      setBusy('login-btn', true, 'Cargando sistema…');
      await withTimeout(boot(data.session), 'La sesión fue validada, pero el sistema tardó demasiado en cargar.');
    } catch (error) {
      console.error('Login error:', error);
      renderLogin(error?.message || 'No se pudo iniciar sesión.');
    }
  });

  document.getElementById('magic-btn').addEventListener('click', async () => {
    if (!supabase) return renderLogin('Supabase no está configurado en este deployment.');
    const email = document.getElementById('email').value.trim().toLowerCase();
    if (!email) return renderLogin('Escribe primero tu correo electrónico.');
    setBusy('magic-btn', true, 'Enviando…');
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } }),
        'La solicitud tardó demasiado. Revisa la conexión con Supabase.'
      );
      renderLogin(error ? error.message : 'Revisa tu correo. Si tu cuenta ya está autorizada, encontrarás el enlace para entrar.');
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
  if (!isSupabaseConfigured) {
    root.innerHTML = '<div class="auth-shell"><div class="auth-card"><h1>Supabase no configurado</h1><p>Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.</p></div></div>';
    return;
  }

  try {
    let session = existingSession;
    if (!session) {
      const result = await withTimeout(supabase.auth.getSession(), 'No se pudo comprobar la sesión con Supabase.');
      const { data, error } = result;
      if (error) throw error;
      session = data.session;
    }

    if (!session) return renderLogin();

    const result = await withTimeout(
      supabase.from('staff_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
      'La sesión existe, pero no se pudo comprobar tu rol. Revisa las políticas de acceso de staff_roles en Supabase.'
    );
    const { data: staff, error: staffError } = result;

    if (staffError) throw staffError;
    if (!staff || !AUTHORIZED_ROLES.includes(staff.role)) {
      await supabase.auth.signOut();
      return renderLogin('Tu cuenta está autenticada, pero todavía no tiene un rol autorizado.');
    }

    try {
      await import('./main.jsx');
    } catch (error) {
      console.error('Error loading application:', error);
      renderLogin(`La sesión es válida, pero no se pudo cargar el sistema: ${error?.message || 'error desconocido'}`);
    }
  } catch (error) {
    console.error('Authentication bootstrap error:', error);
    renderLogin(error?.message || 'No se pudo completar el acceso al sistema.');
  }
}

supabase?.auth.onAuthStateChange((_event, session) => {
  if (!session) renderLogin();
});

boot();

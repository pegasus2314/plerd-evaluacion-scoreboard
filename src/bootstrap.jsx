import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const root = document.getElementById('root');
const AUTHORIZED_ROLES = ['master_admin', 'coordinator', 'evaluator'];
let booting = false;
let loginListenersReady = false;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

function withTimeout(promise, ms, message = 'La conexión tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
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
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    setBusy('login-btn', true, 'Verificando…');
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        12000,
        'Supabase no respondió a tiempo. Revisa Vercel y las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
      );
      if (result.error) throw result.error;
      if (!result.data?.session) throw new Error('Supabase autenticó la solicitud, pero no devolvió una sesión.');
      setBusy('login-btn', true, 'Cargando sistema…');
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
        12000,
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
      const result = await withTimeout(
        supabase.auth.getSession(),
        10000,
        'No se pudo comprobar la sesión con Supabase.'
      );
      if (result.error) throw result.error;
      session = result.data?.session || null;
    }

    if (!session) {
      renderLogin();
      return;
    }

    const staffResult = await withTimeout(
      supabase.from('staff_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
      10000,
      'No se pudo comprobar tu rol de acceso en Supabase.'
    );

    if (staffResult.error) throw staffResult.error;
    const staff = staffResult.data;

    if (!staff || !AUTHORIZED_ROLES.includes(staff.role)) {
      await withTimeout(supabase.auth.signOut(), 8000, 'No se pudo cerrar la sesión.');
      renderLogin('Tu cuenta está autenticada, pero todavía no tiene un rol autorizado.');
      return;
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
  } finally {
    booting = false;
  }
}

if (supabase && !loginListenersReady) {
  loginListenersReady = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' && !booting) renderLogin();
    if (event === 'SIGNED_IN' && session && !booting) boot(session);
  });
}

boot();

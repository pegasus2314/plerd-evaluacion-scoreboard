import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const MASTER_EMAIL = 'itsalberthjesus@gmail.com';
const root = document.getElementById('root');

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

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
        <div class="auth-master-box">
          <strong>Primer acceso del Master Admin</strong>
          <p>Si todavía no existe tu cuenta, puedes crearla únicamente con el correo maestro autorizado.</p>
          <button id="master-btn" class="auth-link">Crear acceso Master Admin</button>
        </div>
        <small class="auth-foot">Acceso protegido por Supabase Auth y roles de la base de datos.</small>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    setBusy('login-btn', true, 'Entrando…');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      renderLogin(error.message);
      return;
    }
    await boot();
  });

  document.getElementById('magic-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim().toLowerCase();
    if (!email) return renderLogin('Escribe primero tu correo electrónico.');
    setBusy('magic-btn', true, 'Enviando…');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } });
    renderLogin(error ? error.message : 'Revisa tu correo. Si tu cuenta ya está autorizada, encontrarás el enlace para entrar.');
  });

  document.getElementById('master-btn').addEventListener('click', async () => {
    setBusy('master-btn', true, 'Creando…');
    const password = window.prompt('Crea una contraseña para el Master Admin (mínimo 8 caracteres):');
    if (!password || password.length < 8) return renderLogin('La contraseña debe tener al menos 8 caracteres.');
    const { error } = await supabase.auth.signUp({ email: MASTER_EMAIL, password, options: { data: { full_name: 'Albert Jesús Silvestre' }, emailRedirectTo: window.location.origin } });
    renderLogin(error ? error.message : 'Cuenta maestra creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
  });
}

function setBusy(id, busy, label) {
  const button = document.getElementById(id);
  if (button) { button.disabled = busy; if (busy) button.textContent = label; }
}

async function boot() {
  if (!isSupabaseConfigured) {
    root.innerHTML = '<div class="auth-shell"><div class="auth-card"><h1>Supabase no configurado</h1><p>Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.</p></div></div>';
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return renderLogin(sessionError.message);
  if (!sessionData.session) return renderLogin();

  const { data: staff, error: staffError } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', sessionData.session.user.id)
    .maybeSingle();

  if (staffError) return renderLogin(staffError.message);
  if (!staff || !['master_admin', 'coordinator', 'evaluator'].includes(staff.role)) {
    await supabase.auth.signOut();
    return renderLogin('Tu cuenta está autenticada, pero todavía no tiene un rol autorizado.');
  }

  await import('./main.jsx');
}

supabase?.auth.onAuthStateChange((_event, session) => {
  if (!session) renderLogin();
});

boot();

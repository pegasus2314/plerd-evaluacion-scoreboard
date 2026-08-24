import { supabase, isSupabaseConfigured } from './lib/supabase';
import './auth.css';

const root = document.getElementById('root');
const AUTHORIZED_ROLES = ['master_admin', 'coordinador', 'coordinator', 'evaluador', 'evaluator', 'admin'];
const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

function renderLogin(message = '') {
  root.innerHTML = `<div class="auth-shell"><div class="auth-card"><div class="auth-brand"><div class="auth-mark">R17</div><div><strong>Regional 17</strong><span>Sistema de evaluación</span></div></div><div class="auth-kicker">ACCESO PRIVADO</div><h1>Iniciar sesión</h1><p class="auth-copy">Accede como coordinador, evaluador o Master Admin.</p>${message ? `<div class="auth-message">${escapeHtml(message)}</div>` : ''}<form id="login-form"><label>Correo electrónico<input id="email" type="email" autocomplete="email" required placeholder="tu-correo@ejemplo.com" /></label><label>Contraseña<input id="password" type="password" autocomplete="current-password" required placeholder="••••••••" /></label><button id="login-btn" type="submit">Entrar</button></form><div class="auth-divider"><span>o</span></div><button id="magic-btn" class="auth-secondary">Enviar enlace de acceso</button><small class="auth-foot">Acceso protegido por Supabase Auth y roles de la base de datos.</small></div></div>`;
  document.getElementById('login-form').addEventListener('submit', async event => { event.preventDefault(); const email=document.getElementById('email').value.trim().toLowerCase(); const password=document.getElementById('password').value; setBusy('login-btn',true,'Verificando…'); try { const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; setBusy('login-btn',true,'Cargando sistema…'); await boot(data.session); } catch(error) { renderLogin(error?.message||'No se pudo iniciar sesión.'); } });
  document.getElementById('magic-btn').addEventListener('click', async () => { const email=document.getElementById('email').value.trim().toLowerCase(); if(!email) return renderLogin('Escribe primero tu correo electrónico.'); setBusy('magic-btn',true,'Enviando…'); const {error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:window.location.origin}}); renderLogin(error ? error.message : 'Revisa tu correo. Si tu cuenta ya está autorizada, encontrarás el enlace para entrar.'); });
}
function setBusy(id,busy,label){ const button=document.getElementById(id); if(button){button.disabled=busy;if(label)button.textContent=label;} }
async function boot(existingSession=null){
  if(!isSupabaseConfigured){ root.innerHTML='<div class="auth-shell"><div class="auth-card"><h1>Supabase no configurado</h1><p>Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.</p></div></div>'; return; }
  try {
    let session=existingSession; if(!session){const {data,error}=await supabase.auth.getSession(); if(error) throw error; session=data.session;}
    if(!session) return renderLogin();
    const {data:roleRow,error:roleError}=await supabase.from('scoreboard_user_roles').select('rol').eq('user_id',session.user.id).maybeSingle();
    if(roleError) throw roleError;
    if(!roleRow || !AUTHORIZED_ROLES.includes(roleRow.rol)){ await supabase.auth.signOut(); return renderLogin('Tu cuenta está autenticada, pero todavía no tiene un rol autorizado.'); }
    try { await import('./main.jsx'); } catch(error){ console.error('Error loading application:',error); renderLogin(`La sesión es válida, pero no se pudo cargar el sistema: ${error?.message||'error desconocido'}`); }
  } catch(error){ console.error('Authentication bootstrap error:',error); renderLogin(error?.message||'No se pudo completar el acceso al sistema.'); }
}
supabase?.auth.onAuthStateChange((_event,session)=>{ if(!session) renderLogin(); });
boot();
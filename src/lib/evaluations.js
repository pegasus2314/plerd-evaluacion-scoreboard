import { supabase } from './supabase';

function requireSupabase() { if (!supabase) throw new Error('Supabase no está configurado.'); return supabase; }

async function requireSession() {
  const db = requireSupabase();
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Debes iniciar sesión como coordinador o evaluador para realizar esta acción.');
  return data.session;
}

async function requireStaff() {
  const db = requireSupabase();
  const session = await requireSession();
  const { data, error } = await db.from('staff_roles').select('role').eq('user_id', session.user.id).maybeSingle();
  if (error) throw error;
  if (!data || !['coordinator', 'evaluator', 'master_admin'].includes(data.role)) throw new Error('Tu cuenta está autenticada, pero no tiene permisos de coordinador, evaluador o Master Admin.');
  return { db, session, role: data.role };
}

export async function getCurrentStaff() {
  if (!supabase) return { session: null, role: null };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { session: null, role: null };
  const { data: staff } = await supabase.from('staff_roles').select('role').eq('user_id', data.session.user.id).maybeSingle();
  return { session: data.session, role: staff?.role || null };
}

export async function listDelegates() { const db=requireSupabase(); const {data,error}=await db.from('delegates').select('id,name,country,model,nuid,checked_in,commission_id,created_at,commissions(id,name)').order('name'); if(error) throw error; return (data||[]).map(d=>({...d,commission_name:d.commissions?.name||''})); }
export async function createDelegate({name,country,model,nuid,commission_id}) { const {db}=await requireStaff(); const clean={name:name.trim(),country:country.trim(),model:model?.trim()||null,nuid:nuid?.trim()||null,commission_id:commission_id||null,checked_in:false}; if(!clean.name||!clean.country) throw new Error('El nombre y el país son obligatorios.'); const {data,error}=await db.from('delegates').insert(clean).select('id,name,country,model,nuid,checked_in,commission_id,created_at,commissions(id,name)').single(); if(error) throw error; return {...data,commission_name:data.commissions?.name||''}; }
export async function updateDelegate(delegateId,{name,country,model,nuid,commission_id}) { const {db}=await requireStaff(); const clean={name:name.trim(),country:country.trim(),model:model?.trim()||null,nuid:nuid?.trim()||null,commission_id:commission_id||null}; if(!clean.name||!clean.country) throw new Error('El nombre y el país son obligatorios.'); const {data,error}=await db.from('delegates').update(clean).eq('id',delegateId).select('id,name,country,model,nuid,checked_in,commission_id,created_at,commissions(id,name)').single(); if(error) throw error; return {...data,commission_name:data.commissions?.name||''}; }
export async function deleteDelegate(delegateId) { const {db}=await requireStaff(); const {error}=await db.from('delegates').delete().eq('id',delegateId); if(error) throw error; }
export async function listCommissions() { const db=requireSupabase(); const {data,error}=await db.from('commissions').select('id,name').eq('active',true).order('name'); if(error) throw error; return data||[]; }
export async function setDelegateAttendance(delegateId,checkedIn) { const {db}=await requireStaff(); const {data,error}=await db.from('delegates').update({checked_in:checkedIn}).eq('id',delegateId).select('id,checked_in').single(); if(error) throw error; return data; }
export async function saveEvaluation({delegateId,commissionId,evaluatorId,scores,total,comments}) { const {db,session}=await requireStaff(); if(evaluatorId!==session.user.id) throw new Error('El evaluador debe coincidir con la cuenta autenticada.'); const {data,error}=await db.from('evaluations').insert({delegate_id:delegateId,commission_id:commissionId,evaluator_id:evaluatorId,scores,total,comments:comments||null}).select('id').single(); if(error) throw error; return data; }
export async function listEvaluations() { const db=requireSupabase(); const {data,error}=await db.from('evaluations').select('id,delegate_id,commission_id,evaluator_id,scores,total,comments,created_at,delegates(name,country,model),commissions(name)').order('created_at',{ascending:false}); if(error) throw error; return (data||[]).map(row=>({id:row.id,delegateId:row.delegate_id,delegateName:row.delegates?.name||'Delegado',country:row.delegates?.country||'',model:row.delegates?.model||'',commission:row.commissions?.name||'',evaluatorId:row.evaluator_id,scores:row.scores||{},total:Number(row.total),comments:row.comments||'',savedAt:row.created_at})); }

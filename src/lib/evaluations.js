import { supabase } from './supabase';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

export async function listDelegates() {
  const db = requireSupabase();
  const { data, error } = await db.from('delegates').select('id,name,country,model,nuid,checked_in,created_at').order('name');
  if (error) throw error;
  return data || [];
}

export async function createDelegate({ name, country, model, nuid }) {
  const db = requireSupabase();
  const clean = { name: name.trim(), country: country.trim(), model: model?.trim() || null, nuid: nuid?.trim() || null, checked_in: false };
  if (!clean.name || !clean.country) throw new Error('El nombre y el país son obligatorios.');
  const { data, error } = await db.from('delegates').insert(clean).select('id,name,country,model,nuid,checked_in,created_at').single();
  if (error) throw error;
  return data;
}

export async function updateDelegate(delegateId, { name, country, model, nuid }) {
  const db = requireSupabase();
  const clean = { name: name.trim(), country: country.trim(), model: model?.trim() || null, nuid: nuid?.trim() || null };
  if (!clean.name || !clean.country) throw new Error('El nombre y el país son obligatorios.');
  const { data, error } = await db.from('delegates').update(clean).eq('id', delegateId).select('id,name,country,model,nuid,checked_in,created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteDelegate(delegateId) {
  const db = requireSupabase();
  const { error } = await db.from('delegates').delete().eq('id', delegateId);
  if (error) throw error;
}

export async function listCommissions() {
  const db = requireSupabase();
  const { data, error } = await db.from('commissions').select('id,name').eq('active', true).order('name');
  if (error) throw error;
  return data || [];
}

export async function setDelegateAttendance(delegateId, checkedIn) {
  const db = requireSupabase();
  const { data, error } = await db.from('delegates').update({ checked_in: checkedIn }).eq('id', delegateId).select('id,checked_in').single();
  if (error) throw error;
  return data;
}

export async function saveEvaluation({ delegateId, commissionId, evaluatorId, scores, total, comments }) {
  const db = requireSupabase();
  const { data, error } = await db.from('evaluations').insert({ delegate_id: delegateId, commission_id: commissionId, evaluator_id: evaluatorId, scores, total, comments: comments || null }).select('id').single();
  if (error) throw error;
  return data;
}

export async function listEvaluations() {
  const db = requireSupabase();
  const { data, error } = await db.from('evaluations').select('id,delegate_id,commission_id,evaluator_id,scores,total,comments,created_at,delegates(name,country,model),commissions(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, delegateId: row.delegate_id, delegateName: row.delegates?.name || 'Delegado', country: row.delegates?.country || '', model: row.delegates?.model || '', commission: row.commissions?.name || '', evaluatorId: row.evaluator_id, scores: row.scores || {}, total: Number(row.total), comments: row.comments || '', savedAt: row.created_at }));
}

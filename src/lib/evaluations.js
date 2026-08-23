import { supabase } from './supabase';

export async function listDelegates() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('delegates').select('id,name,country,model,nuid,checked_in').order('name');
  if (error) throw error;
  return data || [];
}

export async function listCommissions() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('commissions').select('id,name').eq('active', true).order('name');
  if (error) throw error;
  return data || [];
}

export async function setDelegateAttendance(delegateId, checkedIn) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('delegates').update({ checked_in: checkedIn }).eq('id', delegateId).select('id,checked_in').single();
  if (error) throw error;
  return data;
}

export async function saveEvaluation({ delegateId, commissionId, evaluatorId, scores, total, comments }) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('evaluations').insert({ delegate_id: delegateId, commission_id: commissionId, evaluator_id: evaluatorId, scores, total, comments: comments || null }).select('id').single();
  if (error) throw error;
  return data;
}

export async function listEvaluations() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('evaluations').select('id,delegate_id,commission_id,evaluator_id,scores,total,comments,created_at,delegates(name,country,model),commissions(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, delegateId: row.delegate_id, delegateName: row.delegates?.name || 'Delegado', country: row.delegates?.country || '', model: row.delegates?.model || '', commission: row.commissions?.name || '', evaluatorId: row.evaluator_id, scores: row.scores || {}, total: Number(row.total), comments: row.comments || '', savedAt: row.created_at }));
}

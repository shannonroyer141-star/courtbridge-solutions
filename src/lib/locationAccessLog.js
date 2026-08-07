import { supabase } from '../supabase';

// GPS protection: record every person who views or exports exact coordinates.
export async function logLocationAccess(action, { clientId = null, checkinCount = null } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('location_access_log').insert([{ user_id: user.id, action, client_id: clientId, checkin_count: checkinCount }]);
}

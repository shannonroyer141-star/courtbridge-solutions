import { supabase } from './supabase'

export const ORG_ROLES = [
  { value: 'admin', label: 'Admin — full org access' },
  { value: 'case_manager', label: 'Case Manager' },
  { value: 'front_desk', label: 'Front Desk / Intake' },
  { value: 'provider', label: 'Provider (default)' },
]

export function validateStaffInvite(form) {
  if (!form.full_name.trim()) return 'Name is required.'
  if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required.'
  return null
}

export async function createStaffInvite(organizationId, invitedBy, form) {
  const { data, error } = await supabase.from('staff_invites').insert({
    organization_id: organizationId,
    invited_by: invitedBy,
    email: form.email.trim(),
    full_name: form.full_name.trim(),
    org_role: form.org_role || 'provider',
    is_org_admin: !!form.is_org_admin,
  }).select().single()
  if (error) return { link: null, invite: null, error }
  return { link: `${window.location.origin}/join-staff?token=${data.token}`, invite: data, error: null }
}

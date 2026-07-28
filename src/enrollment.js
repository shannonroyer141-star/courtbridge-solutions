import { supabase } from './supabase'

export const PROGRAM_TYPES = [
  'Drug Court', 'DUI / Alcohol Court', 'Mental Health Court',
  'Veterans Treatment Court', 'Batterers Intervention Program (BIP)',
  'Anger Management', 'Recovery Court', 'Family Treatment Court', 'Probation', 'Other'
]

export const ENROLLMENT_TYPES = [
  { value: 'court_ordered', label: 'Court-Ordered — I have a court order' },
  { value: 'probation_referred', label: 'Probation Referred — referred by probation officer' },
  { value: 'voluntary', label: 'Voluntary — participant chose this program' },
  { value: 'no_document', label: 'No Document Yet — paperwork pending' }
]

export const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

export const emptyEnrollmentForm = () => ({
  client_name: '', client_email: '', phone: '', date_of_birth: '',
  program_type: '', enrollment_type: 'court_ordered', case_number: '',
  program_phase: 'Phase 1', reporting_requirements: '', checkin_schedule: '', message: ''
})

export function validateParticipantInfo(form) {
  if (!form.client_name.trim()) return 'Full name is required.'
  if (!form.client_email.trim() || !form.client_email.includes('@')) return 'A valid email is required.'
  if (!form.phone.trim()) return 'Phone number is required.'
  if (!form.date_of_birth) return 'Date of birth is required.'
  return null
}

export function validateProgramRequirements(form) {
  if (!form.program_type) return 'Program type is required.'
  if (!form.reporting_requirements.trim()) return 'Program reporting requirements are required.'
  if (!form.checkin_schedule.trim()) return 'Check-in schedule is required.'
  return null
}

export function smsTextFor(form, link) {
  return `You have been enrolled in ${form.program_type} through CourtBridge Solutions. Click the link below to complete your enrollment within 48 hours. This is required. ${link}`
}

export async function createEnrollmentInvite(providerId, form) {
  const { data, error } = await supabase.from('invites').insert({
    provider_id: providerId,
    client_name: form.client_name, client_email: form.client_email,
    phone: form.phone, date_of_birth: form.date_of_birth,
    program_type: form.program_type, enrollment_type: form.enrollment_type,
    case_number: form.case_number || null, program_phase: form.program_phase,
    reporting_requirements: form.reporting_requirements,
    checkin_schedule: form.checkin_schedule, message: form.message || null,
    accepted: false, expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  }).select().single()
  if (error) return { link: null, error }
  return { link: `${window.location.origin}/enroll?token=${data.token}`, error: null }
}

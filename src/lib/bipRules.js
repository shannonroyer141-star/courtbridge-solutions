// Checks that mirror DCF's BIP monitoring checklists (BIP Monitoring Review Tools, Florida DCF
// Office of Domestic Violence) and Florida Rule 65H-2, F.A.C. Each item names the rule it
// comes from so a provider can see why it matters.

// ---------------------------------------------------------------------------
// Personnel File Review (Employee File Review tab).
export function missingStaffItems(s) {
  const out = [];
  const isFac = s.role_title === 'facilitator';
  const isAssessor = s.role_title === 'assessor';
  if (!isFac && !isAssessor) return out;
  const num = v => Number(v) || 0;
  if (!s.photo_id_on_file) out.push('Photo ID');
  if (!s.address_on_file || !s.home_phone_on_file || !s.date_of_birth_on_file) out.push('Name, address, phone, DOB');
  if (!s.resume_or_application_on_file) out.push('Resume or application');
  if (!s.employment_history_check_date) out.push('Employment history check');
  else if (s.hire_date && s.employment_history_check_date > s.hire_date) out.push('Employment history check done after hire');
  if (!s.background_check_date) out.push('Level 1 background check');
  if (!s.good_moral_character_signed_at) out.push('Affidavit of Good Moral Character (CF 1649)');
  else {
    if (!s.good_moral_character_notarized) out.push('Initial affidavit notarized');
    if ((Date.now() - new Date(s.good_moral_character_signed_at)) / 86400000 > 365) out.push('Annual affidavit renewal');
  }
  if (!s.job_description_on_file) out.push('Job description');
  if (!s.policy_manual_receipt_date) out.push('Policy manual receipt');
  if (['490', '491'].includes(s.license_type) && !s.confidentiality_statement_signed) out.push('Confidentiality statement (Ch. 490/491)');
  if (num(s.continuing_ed_hours_ytd) < 12 || Number(s.continuing_ed_year) !== new Date().getFullYear()) out.push(`12 CE hours for ${new Date().getFullYear()}`);
  if (isFac) {
    if (!s.credential_basis) out.push("Degree or 2 years' experience");
    if (num(s.dv_training_hours_completed) < 40) out.push('40 hours DV training');
    if (num(s.facilitator_training_hours) < 21) out.push('21 hours facilitator training');
    if (num(s.supervised_facilitation_hours) < 72) out.push('72 supervised group hours');
    if (!s.odv_training_approved_at) out.push('ODV approval of training');
  }
  if (isAssessor) {
    if (!s.license_type || s.license_type === 'none') out.push('License (Ch. 490, 491, or 397) or exemption');
    if (s.license_type !== 'exempt_3yr_experience' && num(s.assessor_supervised_experience_years) < 2) out.push('2 years supervised assessment experience');
    if (num(s.dv_training_hours_completed) < 30) out.push('30 hours DV training');
  }
  return out;
}

// ---------------------------------------------------------------------------
// Participant File Review. Inputs are the participant's rows; returns
// [{ item, rule, ok: true|false|null (null = not applicable yet) }].
export function participantFileChecks({ intake, notices = [], discharge, sessions = [], fees = [], violations = [] }) {
  const i = intake || {};
  const enroll = notices.find(n => n.notice_type === 'enrollment');
  const disNotice = discharge ? notices.find(n => n.notice_type === 'discharge' && n.discharge_reason === discharge.category) : null;
  const within = (doneIso, dueIso) => !!doneIso && new Date(doneIso) <= new Date(dueIso);
  const nonCompliance = violations.filter(v => !v.restricted);
  const checks = [
    { item: 'Proof of identity (government photo ID)', rule: '65H-2.016(9)(c)1', ok: !!i.photo_id_on_file },
    { item: 'Court order', rule: '65H-2.016(9)(c)2', ok: !!i.court_order_on_file },
    { item: 'Police report, if applicable', rule: '65H-2.016(9)(c)2', ok: i.police_report_on_file === 'not_applicable' ? null : i.police_report_on_file === 'yes' },
    { item: 'Fees, rules, and expectations explained at intake', rule: '65H-2.016(5)(b)1', ok: !!i.rules_explained_at },
    { item: 'Participant Enrollment Form', rule: '65H-2.016(5)(b)2', ok: !!i.enrollment_form_completed_at },
    { item: 'Initial eligibility screening (participant eligible)', rule: '65H-2.016(5)(d)', ok: !!i.eligibility_screened_at && i.eligibility_result === 'eligible' },
    { item: 'Victim notified (or attempted) of enrollment', rule: '65H-2.016(8)(b)', ok: !!enroll?.completed_at },
    { item: 'Enrollment notice within 3 business days', rule: '65H-2.016(8)(b)', ok: enroll?.completed_at ? within(enroll.completed_at, enroll.due_at) : false },
    { item: "Asked how the victim wants updates", rule: '65H-2.016(8)(b)', ok: !!enroll?.asked_update_preference },
    { item: 'Enrollment notice lists DV center, law enforcement, probation/parole, state attorney', rule: '65H-2.016(8)(b)',
      ok: !!enroll && enroll.included_dv_center && enroll.included_law_enforcement && enroll.included_state_attorney && enroll.included_probation !== 'no' },
    { item: 'Enrollment notice includes program goals and objectives', rule: '65H-2.016(8)(b)', ok: !!enroll?.included_program_goals },
    { item: 'Enrollment notice says victim disclosures are not privileged', rule: '65H-2.016(8)(b)', ok: !!enroll?.included_not_privileged },
    { item: 'Orientation attended, signed acknowledgment in file', rule: '65H-2.016(5)(e)', ok: !!i.orientation_attended_at && !!i.orientation_ack_signed },
    { item: 'Assessment (mental health / substance abuse)', rule: '65H-2.016(5)(f), (9)(c)4', ok: !!i.assessment_completed_at },
    { item: 'Financial assessment', rule: '65H-2.016(9)(c)3', ok: !!i.financial_assessment_at },
    { item: 'How limited English proficiency was addressed', rule: '65H-2.016(6)(h)', ok: i.limited_english ? !!(i.lep_how_addressed || '').trim() : null },
    { item: 'Attendance record (dates attended, missed, made up)', rule: '65H-2.016(9)(c)5', ok: sessions.length > 0 },
    { item: 'Record of fee payments (dates and amounts)', rule: '65H-2.016(9)(c)6', ok: fees.length > 0 || !!i.fee_reduced_or_waived },
    { item: 'Non-compliance reports sent to referral source / probation', rule: '65H-2.016(9)(c)8',
      ok: nonCompliance.length === 0 ? null : nonCompliance.every(v => v.status !== 'draft' && (v.submitted_to || '').trim()) },
  ];
  if (discharge) {
    checks.push(
      { item: 'Discharge report sent to referral source', rule: '65H-2.016(7)(b)2, (9)(c)9', ok: !!discharge.referral_report_sent_at },
      { item: 'Discharge report within 3 business days', rule: '65H-2.016(7)(b)2', ok: within(discharge.referral_report_sent_at, discharge.report_due_at) },
    );
    if (discharge.probation_applicable) {
      checks.push({ item: 'Discharge report to probation within 3 business days', rule: '65H-2.016(7)(b)2', ok: within(discharge.probation_report_sent_at, discharge.report_due_at) });
    }
    checks.push(
      { item: 'Victim notified (or attempted) of discharge within 24 hours, with reason', rule: '65H-2.016(8)(c)', ok: disNotice ? within(disNotice.completed_at, disNotice.due_at) : false },
    );
  }
  return checks;
}

// Attendance progress toward the 65H-2.016(6)(b) minimums.
export function attendanceProgress(sessions = [], enrollmentDate, maxUnexcused) {
  const credited = sessions.filter(s => s.attendance_status === 'attended' || s.attendance_status === 'made_up').length;
  const madeUpFor = new Set(sessions.filter(s => s.made_up_for_record_id).map(s => s.made_up_for_record_id));
  const missed = sessions.filter(s => s.attendance_status === 'missed');
  const outstandingMissed = missed.filter(s => !madeUpFor.has(s.id));
  const weeks = enrollmentDate ? Math.floor((Date.now() - new Date(`${enrollmentDate}T12:00:00`)) / (7 * 86400000)) : null;
  return {
    credited,
    missedTotal: missed.length,
    outstandingMissed,
    weeks,
    overUnexcusedLimit: maxUnexcused != null && missed.length > maxUnexcused,
    atUnexcusedLimit: maxUnexcused != null && missed.length === maxUnexcused,
  };
}

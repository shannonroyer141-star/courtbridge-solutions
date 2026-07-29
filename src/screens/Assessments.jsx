import { useState } from 'react';
import { CARD_BG, ACCENT, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const ASSESSMENTS = [
  {
    court: 'Drug Court',
    icon: '💊',
    color: '#0F2A52',
    tools: [
      { name: 'ASI', full: 'Addiction Severity Index', note: 'Gold standard, used nationwide' },
      { name: 'GAIN', full: 'Global Appraisal of Individual Needs', note: 'Very common in drug courts' },
      { name: 'SASSI', full: 'Substance Abuse Subtle Screening Inventory', note: '' },
      { name: 'DIS-IV', full: 'Diagnostic Interview Schedule', note: '' },
    ],
  },
  {
    court: 'DUI / Alcohol Court',
    icon: '🚗',
    color: '#1B3A6B',
    tools: [
      { name: 'MAST', full: 'Michigan Alcohol Screening Test', note: 'Standard pre-clinical interview tool' },
      { name: 'DAST', full: 'Drug Abuse Screening Test', note: 'Standard pre-clinical interview tool' },
      { name: 'AUDIT', full: 'Alcohol Use Disorders Identification Test', note: '10-item standard screening' },
      { name: 'AUDIT-C', full: 'Alcohol Use Disorders Identification Test — Short Form', note: '3-question quick screening version' },
    ],
  },
  {
    court: 'Mental Health Court',
    icon: '🧠',
    color: '#2C5282',
    tools: [
      { name: 'PHQ-9', full: 'Patient Health Questionnaire', note: 'Depression screening' },
      { name: 'GAD-7', full: 'Generalized Anxiety Disorder Scale', note: 'Anxiety screening' },
      { name: 'LSI-R', full: 'Level of Service Inventory Revised', note: 'Risk and needs assessment, widely used in criminal justice' },
      { name: 'BPRS', full: 'Brief Psychiatric Rating Scale', note: '' },
    ],
  },
  {
    court: 'Veterans Treatment Court',
    icon: '🎖️',
    color: '#5B9BF0',
    tools: [
      { name: 'PCL-M', full: 'PTSD Checklist Military Version', note: '17-item, standard for veterans' },
      { name: 'AUDIT-C', full: 'Alcohol Use Disorders Identification Test — Short Form', note: 'Used heavily in VA settings' },
      { name: 'PHQ-9', full: 'Patient Health Questionnaire', note: 'Depression screening' },
      { name: 'TBI Screening', full: 'Traumatic Brain Injury Assessment', note: '' },
    ],
  },
  {
    court: 'Domestic Violence / BIP',
    icon: '🛡️',
    color: '#3D6FA8',
    tools: [
      { name: 'DV Assessment', full: 'Domestic Violence Structured Clinical Interview', note: 'Biological, psychological, social factors' },
      { name: 'DVSI', full: 'Domestic Violence Screening Instrument', note: '' },
      { name: 'DA', full: 'Danger Assessment', note: 'Risk to victim' },
      { name: 'SARA', full: 'Spousal Assault Risk Assessment', note: '' },
    ],
  },
  {
    court: 'Family Treatment Court',
    icon: '👨‍👩‍👧',
    color: '#7DA6E0',
    tools: [
      { name: 'Parenting Assessment', full: 'Parenting Capacity and Child Safety Evaluation', note: '' },
      { name: 'CAFAS', full: 'Child and Adolescent Functional Assessment Scale', note: '' },
      { name: 'ASI', full: 'Addiction Severity Index', note: 'Substance abuse component' },
    ],
  },
  {
    court: 'Anger Management Court',
    icon: '⚡',
    color: '#9FB2CE',
    tools: [
      { name: 'STAXI', full: 'State-Trait Anger Expression Inventory', note: '' },
      { name: 'NAS', full: 'Novaco Anger Scale', note: '' },
    ],
  },
];

export default function Assessments() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ color: TEXT, fontSize: 28, margin: '0 0 8px' }}>Assessments</h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
          Assessment Integration — Phase 2 Development. CourtBridge Solutions is building standardized assessment tracking for each specialty court type. The tools below will be integrated directly into client records.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {ASSESSMENTS.map(section => (
          <div key={section.court} style={{ background: CARD_BG, borderRadius: 12, overflow: 'hidden', borderLeft: `4px solid ${section.color}`, border: `0.5px solid ${BORDER}`, borderLeftWidth: 4, borderLeftColor: section.color }}>
            <button
              onClick={() => setExpanded(expanded === section.court ? null : section.court)}
              style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{section.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{section.court}</div>
                  <div style={{ fontSize: 13, color: TEXT_DIM, marginTop: 2 }}>{section.tools.length} assessment tools</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: TEXT_DIM }}>{expanded === section.court ? '▼' : '▶'}</span>
            </button>

            {expanded === section.court && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 16 }}>
                  {section.tools.map(tool => (
                    <div key={tool.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}` }}>
                      <div style={{ background: section.color, color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {tool.name}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: TEXT, fontWeight: 500 }}>{tool.full}</div>
                        {tool.note && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{tool.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30, background: 'rgba(91,155,240,0.1)', borderRadius: 12, padding: 20, border: `0.5px solid ${ACCENT}` }}>
        <div style={{ fontSize: 14, color: ACCENT, fontWeight: 600, marginBottom: 6 }}>🔮 Phase 2 Feature</div>
        <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>
          When Phase 2 launches, providers will be able to select the appropriate assessment tool for each client, record results, track completion dates, and include assessment data in court-ready compliance reports.
        </p>
      </div>
    </div>
  );
}

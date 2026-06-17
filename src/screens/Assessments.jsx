import React, { useState } from 'react';

const ASSESSMENTS = [
  {
    court: 'Drug Court',
    icon: '💊',
    color: '#27AE60',
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
    color: '#E67E22',
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
    color: '#8E44AD',
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
    color: '#2C3E50',
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
    color: '#C0392B',
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
    color: '#E05A2B',
    tools: [
      { name: 'Parenting Assessment', full: 'Parenting Capacity and Child Safety Evaluation', note: '' },
      { name: 'CAFAS', full: 'Child and Adolescent Functional Assessment Scale', note: '' },
      { name: 'ASI', full: 'Addiction Severity Index', note: 'Substance abuse component' },
    ],
  },
  {
    court: 'Anger Management Court',
    icon: '⚡',
    color: '#D35400',
    tools: [
      { name: 'STAXI', full: 'State-Trait Anger Expression Inventory', note: '' },
      { name: 'NAS', full: 'Novaco Anger Scale', note: '' },
    ],
  },
];

export default function Assessments() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: '30px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1B3A6B', fontSize: '28px', margin: '0 0 8px' }}>Assessments</h1>
        <p style={{ color: '#666', fontSize: '15px', margin: 0, maxWidth: '600px', lineHeight: '1.6' }}>
          Assessment Integration — Phase 2 Development. CourtBridge Solutions is building standardized assessment tracking for each specialty court type. The tools below will be integrated directly into client records.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {ASSESSMENTS.map(section => (
          <div key={section.court} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', borderLeft: `4px solid ${section.color}` }}>
            <button
              onClick={() => setExpanded(expanded === section.court ? null : section.court)}
              style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{section.icon}</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1B3A6B' }}>{section.court}</div>
                  <div style={{ fontSize: '13px', color: '#8A9BB0', marginTop: '2px' }}>{section.tools.length} assessment tools</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#8A9BB0' }}>{expanded === section.court ? '▼' : '▶'}</span>
            </button>

            {expanded === section.court && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  {section.tools.map(tool => (
                    <div key={tool.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                      <div style={{ background: section.color, color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {tool.name}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#2C3E50', fontWeight: '500' }}>{tool.full}</div>
                        {tool.note && <div style={{ fontSize: '12px', color: '#8A9BB0', marginTop: '2px' }}>{tool.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', background: '#EBF5FB', borderRadius: '12px', padding: '20px', border: '1px solid #AED6F1' }}>
        <div style={{ fontSize: '14px', color: '#1B3A6B', fontWeight: '600', marginBottom: '6px' }}>🔮 Phase 2 Feature</div>
        <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.6' }}>
          When Phase 2 launches, providers will be able to select the appropriate assessment tool for each client, record results, track completion dates, and include assessment data in court-ready compliance reports.
        </p>
      </div>
    </div>
  );
}
// Small layout components shared by the BIP compliance screens.
import { RED } from '../theme';
import { labelStyle, sectionCard } from '../lib/bipUi';

export function Field({ label, children }) {
  return <div style={{ marginBottom: 4 }}><span style={labelStyle}>{label}</span>{children}</div>;
}

export function Row2({ children }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

export function Col({ children, grow = 1, min = 200 }) {
  return <div style={{ flex: `${grow} 1 ${min}px` }}>{children}</div>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div style={{ ...sectionCard, borderColor: RED, color: RED, padding: 14 }}>{error}</div>;
}


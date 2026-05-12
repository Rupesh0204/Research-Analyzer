// Shared inline style constants - used across all pages
// These ensure consistent look regardless of CSS loading

export const C = {
  // Colors
  bg: '#0f0f11',
  surface: '#1a1a1d',
  surface2: '#242428',
  border: '#2e2e34',
  border2: '#3e3e45',
  text: '#f1f1f3',
  muted: '#9898a0',
  dim: '#606068',
  accent: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',

  // Common style objects
  page: {
    padding: '32px',
    maxWidth: '960px',
    margin: '0 auto',
    minHeight: '100vh',
  } as React.CSSProperties,

  card: {
    background: '#1a1a1d',
    border: '1px solid #2e2e34',
    borderRadius: '12px',
    padding: '20px',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#242428',
    border: '1px solid #2e2e34',
    borderRadius: '8px',
    color: '#f1f1f3',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  } as React.CSSProperties,

  btn: {
    padding: '10px 20px',
    background: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  btnGhost: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#9898a0',
    border: '1px solid #2e2e34',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#9898a0',
    marginBottom: '6px',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#606068',
    marginBottom: '12px',
  } as React.CSSProperties,
}

type EmailLayoutProps = {
  title: string
  children: React.ReactNode
}

export function EmailLayout({ title, children }: EmailLayoutProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '32px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff', padding: '32px', borderRadius: 8 }}>
        <h1 style={{ color: '#0f172a' }}>{title}</h1>
        <div style={{ color: '#334155', fontSize: 14 }}>
          {children}
        </div>
        <hr style={{ margin: '32px 0' }} />
        <p style={{ fontSize: 12, color: '#64748b' }}>
          © {new Date().getFullYear()} LEAD Mindset · leadmindset.org
        </p>
      </div>
    </div>
  )
}
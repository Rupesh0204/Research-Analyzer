import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: { default: 'ResearchAI', template: '%s — ResearchAI' },
  description: 'AI-powered research assistant with RAG and semantic search',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e22',
              color: '#f1f1f3',
              border: '1px solid #2e2e34',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}

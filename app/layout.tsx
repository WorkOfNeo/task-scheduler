import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { SPAProvider } from "@/lib/spa-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { AuthProvider } from '@/lib/auth-context'
import { TasksProvider } from '@/lib/tasks-context'
import { ClientsProvider } from '@/lib/clients-context'
import { SettingsProvider } from '@/lib/settings-context'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskFlow - Personal Task Scheduler",
  description: "A personal task scheduler inspired by Motion",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: "/manifest.json",
  generator: 'v0.dev'
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TasksProvider>
              <ClientsProvider>
                <SettingsProvider>
                  <Providers>
                    <SPAProvider>
                      <LayoutWrapper>
                        {children}
                      </LayoutWrapper>
                    </SPAProvider>
                  </Providers>
                </SettingsProvider>
              </ClientsProvider>
            </TasksProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

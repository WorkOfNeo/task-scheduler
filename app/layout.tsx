import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { SPAProvider } from "@/lib/spa-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskFlow - Personal Task Scheduler",
  description: "A personal task scheduler inspired by Motion",
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
          <Providers>
            <SPAProvider>
              <div className="flex h-full">
            <Sidebar />
                <div className="flex-1 flex flex-col">
              <Header />
                  <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
            </SPAProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

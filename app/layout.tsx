import "@/lib/react-19-shim"
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { DerivAPIProvider } from "@/lib/deriv-api-context"
import { ThemeProviderAdvanced } from "@/lib/theme-provider-advanced"

export const metadata: Metadata = {
  title: "Profithub - AI Trading Scanner & Smart Auto Trading",
  description: "Advanced AI trading scanner with multi-strategy analysis. Real Deriv integration, smart auto-trading, and 120-tick market analysis.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProviderAdvanced defaultTheme="dark">
          <DerivAPIProvider>
            <div className="heritage-nebula" />
            <Suspense fallback={null}>{children}</Suspense>
          </DerivAPIProvider>
        </ThemeProviderAdvanced>
        <Analytics />
      </body>
    </html>
  )
}

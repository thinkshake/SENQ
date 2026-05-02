import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { WalletProvider } from "@/contexts/WalletContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "SENQ — 予測マーケット",
  description: "日本初の属性重み付け型予測マーケット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <UserProvider>
              <TooltipProvider>
                <div className="min-h-screen bg-background text-foreground">
                  <SiteHeader />
                  <main>{children}</main>
                  <footer className="mt-20 border-t border-border py-8">
                    <div className="mx-auto max-w-6xl px-4 lg:px-6">
                      <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
                        <span className="font-mono tracking-widest">SENQ</span>
                        <span>© 2026 SENQ. XRPL Parimutuel Prediction Market.</span>
                      </div>
                    </div>
                  </footer>
                </div>
                <Toaster />
              </TooltipProvider>
            </UserProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

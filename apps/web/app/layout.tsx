import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { WalletProvider } from "@/contexts/WalletContext";
import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
  title: "SENQ \u2014 \u4e88\u6e2c\u30de\u30fc\u30b1\u30c3\u30c8",
  description: "\u65e5\u672c\u521d\u306e\u5c5e\u6027\u91cd\u307f\u4ed8\u3051\u578b\u4e88\u6e2c\u30de\u30fc\u30b1\u30c3\u30c8",
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
          <LanguageProvider>
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
                          <span>&copy; 2026 SENQ. EVM Parimutuel Prediction Market.</span>
                        </div>
                      </div>
                    </footer>
                  </div>
                  <Toaster />
                </TooltipProvider>
              </UserProvider>
            </WalletProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

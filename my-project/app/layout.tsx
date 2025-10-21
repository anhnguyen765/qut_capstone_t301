import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "./components/Sidebar";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { ModeToggle } from "./components/ModeToggle";
import { AuthProvider } from "./contexts/AuthContext";
import { ConditionalSidebarTrigger } from "./components/ConditionalSidebarTrigger";
import AuthGuard from "./components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2bentrods CRM",
  description: "Streamline your customer relationship management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased flex min-h-screen w-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthGuard>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex h-16 items-center gap-4 border-b bg-background px-4">
                  <ConditionalSidebarTrigger />
                  <div className="flex-1" />
                  <ModeToggle />
                </header>
                <main className="flex-1 page-container">
                    {children}
                </main>
                <footer className="bg-primary py-5">
                  <div className="page-container text-center text-primary-foreground">
                    &copy; {new Date().getFullYear()} Two Bent Rods. All rights reserved.
                  </div>
                </footer>                
              </div>
            </SidebarProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
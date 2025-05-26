import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "./components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { ModeToggle } from "./components/ModeToggle";

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
      <body className="antialiased flex min-h-screen w-full text-gray-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <main className="flex-1">
                <div className="flex justify-between">
                  <SidebarTrigger className="text-[var(--foreground)] w-10 px-0 h-10" />
                  {children}
                  <ModeToggle />
                </div>
              </main>
              <footer className="bg-[var(--primary)] py-5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[var(--primary-foreground)]">
                  &copy; {new Date().getFullYear()} Two Bent Rods. All rights reserved.
                </div>
              </footer>                
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
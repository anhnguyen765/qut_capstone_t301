import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "./components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
    <body className="antialiased flex min-h-screen w-full text-gray-900">
      <SidebarProvider>
      <AppSidebar />
      <main className="flex w-full h-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  </body>
  </html>
  );
}
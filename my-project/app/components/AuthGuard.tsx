"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  console.log('AuthGuard component mounted!');
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Pages that don't require authentication
  const publicPages = ['/login', '/register'];

  useEffect(() => {
    console.log('AuthGuard - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'pathname:', pathname);
    
    // If not loading and not authenticated, redirect immediately
    if (!isLoading && !isAuthenticated && !publicPages.includes(pathname)) {
      console.log('Redirecting to login...');
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading only while checking authentication
  if (isLoading) {
    console.log('Showing loading state...');
    return (
      <div className="min-h-screen w-full py-8 px-[10%] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on a public page, show nothing (redirect will happen)
  if (!isAuthenticated && !publicPages.includes(pathname)) {
    console.log('Not authenticated, showing nothing...');
    return null;
  }

  console.log('Rendering children...');
  return <>{children}</>;
}

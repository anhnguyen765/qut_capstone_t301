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

  // Pages (or prefixes) that don't require authentication
  // Add '/unsub' so recipients can update preferences without logging in
  const publicPages = ['/login', '/register', '/unsub'];
  // Some environments may not provide pathname immediately; fall back to window.location
  const currentPath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const isPublic = publicPages.some((p) => currentPath === p || currentPath.startsWith(p + '/') || currentPath.startsWith(p));

  useEffect(() => {
    console.log('AuthGuard - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'pathname:', pathname, 'currentPath:', currentPath, 'isPublic:', isPublic);

    // If not loading and not authenticated, redirect immediately (unless this is a public path)
    // Also avoid redirecting when we don't yet have a meaningful pathname (e.g. during initial hydration)
    if (!isLoading && !isAuthenticated && !isPublic && currentPath && currentPath.length > 0) {
      console.log('Redirecting to login...');
      router.replace('/login');
      return;
    }
  // include isPublic and currentPath so the effect re-runs when they become available
  }, [isAuthenticated, isLoading, pathname, currentPath, isPublic, router]);

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
  if (!isAuthenticated && !isPublic) {
    console.log('Not authenticated, showing nothing...');
    return null;
  }

  console.log('Rendering children...');
  return <>{children}</>;
}

'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAuth?: boolean;
}

/**
 * ProtectedRoute component wraps pages that require authentication
 * If user is not authenticated, they'll be redirected to login
 * 
 * Note: Middleware handles most server-side redirects
 * This component ensures client-side protection and state consistency
 */
export function ProtectedRoute({
  children,
  requiredAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading auth state

    if (requiredAuth && !user) {
      // User is not authenticated, redirect to login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const redirectUrl = new URL('/login', window.location.origin);
      redirectUrl.searchParams.set('redirectTo', currentPath);
      router.push(redirectUrl.toString());
    }
  }, [user, loading, requiredAuth, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        Loading...
      </div>
    );
  }

  if (requiredAuth && !user) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}

/**
 * Hook to check if user is authenticated
 * Use this in components that need auth state
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const redirectUrl = new URL('/login', window.location.origin);
      redirectUrl.searchParams.set('redirectTo', currentPath);
      router.push(redirectUrl.toString());
    }
  }, [user, loading, router]);

  return { user, loading, isAuthenticated: !!user };
}

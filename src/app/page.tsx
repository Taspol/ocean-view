'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import ScrollPhoneLanding from '@/components/ui/scroll-phone-landing';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (!loading && user) {
            // Redirect authenticated users to dashboard
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    return <ScrollPhoneLanding />;
}

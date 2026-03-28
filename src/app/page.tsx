'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const ScrollPhoneLanding = dynamic(() => import('@/components/ui/scroll-phone-landing'), {
    ssr: false,
});

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

'use client';

import dynamic from 'next/dynamic';

const ScrollPhoneLanding = dynamic(() => import('@/components/ui/scroll-phone-landing'), {
    ssr: false,
});

export default function HomePage() {
    return <ScrollPhoneLanding />;
}

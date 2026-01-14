'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            router.push(`/login?error=${error}`);
            return;
        }

        if (token) {
            localStorage.setItem('token', token);
            router.push('/dashboard');
        } else {
            router.push('/login?error=no_token');
        }
    }, [router, searchParams]);

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <p>Authenticating...</p>
        </main>
    );
}

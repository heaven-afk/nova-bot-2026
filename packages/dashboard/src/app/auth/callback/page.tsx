'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        console.log('Auth Callback Debug:', { token: !!token, error }); // DEBUG

        if (error) {
            console.error('Auth Error:', error); // DEBUG
            router.push(`/login?error=${error}`);
            return;
        }

        if (token) {
            console.log('Setting token and redirecting...'); // DEBUG
            localStorage.setItem('token', token);
            window.location.href = '/dashboard'; // Force reload to ensure state updates
        } else {
            console.error('No token found'); // DEBUG
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

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <main style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p>Loading...</p>
            </main>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}

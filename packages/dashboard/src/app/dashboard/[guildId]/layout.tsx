'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, GuildConfig } from '@/lib/api';
import styles from './layout.module.css';

export default function GuildLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const guildId = params.guildId as string;
    const [guild, setGuild] = useState<{ id: string; name: string; icon: string | null } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const g = user.guilds.find((g) => g.id === guildId);
            if (g) {
                setGuild(g);
            } else {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, guildId, router]);

    if (authLoading || !user || !guild) {
        return (
            <div className={styles.loader}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    const navItems = [
        { href: `/dashboard/${guildId}`, label: 'General', icon: '⚙️' },
        { href: `/dashboard/${guildId}/moderation`, label: 'Moderation', icon: '🛡️' },
        { href: `/dashboard/${guildId}/commands`, label: 'Commands', icon: '💬' },
        { href: `/dashboard/${guildId}/logging`, label: 'Logging', icon: '📋' },
        { href: `/dashboard/${guildId}/audit`, label: 'Audit Log', icon: '📜' },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.backLink}>
                        ← Back to servers
                    </Link>
                    <div className={styles.guildInfo}>
                        {guild.icon ? (
                            <img
                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=64`}
                                alt={guild.name}
                                className={styles.guildIcon}
                            />
                        ) : (
                            <div className={styles.guildIconPlaceholder}>
                                {guild.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h2 className={styles.guildName}>{guild.name}</h2>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''
                                }`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span>{user.username}</span>
                        <button className={styles.logoutBtn} onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            <main className={styles.main}>{children}</main>
        </div>
    );
}

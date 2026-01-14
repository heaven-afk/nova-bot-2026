'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, useManageableGuilds } from '@/lib/auth';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const guilds = useManageableGuilds();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <main className={styles.main}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                </div>
            </main>
        );
    }

    const getGuildIcon = (guild: { id: string; name: string; icon: string | null }) => {
        if (guild.icon) {
            return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128`;
        }
        return null;
    };

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.logo}>🤖 Nova Bot</h1>
                    <div className={styles.userInfo}>
                        <span>{user.username}</span>
                        <button className={styles.logoutBtn} onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles.container}>
                <h2 className={styles.title}>Select a Server</h2>
                <p className={styles.subtitle}>
                    Choose a server to manage. You can only see servers where you have Manage Server permission.
                </p>

                {guilds.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No servers found with Manage Server permission.</p>
                    </div>
                ) : (
                    <div className={styles.guildGrid}>
                        {guilds.map((guild) => (
                            <Link
                                key={guild.id}
                                href={`/dashboard/${guild.id}`}
                                className={styles.guildCard}
                            >
                                <div className={styles.guildIcon}>
                                    {getGuildIcon(guild) ? (
                                        <Image
                                            src={getGuildIcon(guild)!}
                                            alt={guild.name}
                                            width={64}
                                            height={64}
                                            className={styles.guildImage}
                                        />
                                    ) : (
                                        <div className={styles.guildInitial}>
                                            {guild.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.guildInfo}>
                                    <h3 className={styles.guildName}>{guild.name}</h3>
                                    {guild.owner && (
                                        <span className={styles.ownerBadge}>Owner</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, GuildConfig } from '@/lib/api';
import styles from './page.module.css';

export default function GuildSettingsPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [config, setConfig] = useState<GuildConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, [guildId]);

    async function loadConfig() {
        const result = await api.guilds.getConfig(guildId);
        if (result.data) {
            setConfig(result.data);
        }
        setLoading(false);
    }

    async function toggleFeature(feature: keyof GuildConfig['features']) {
        if (!config) return;

        setSaving(true);
        const currentFeatures = config.features || {};
        const newValue = !currentFeatures[feature];

        const result = await api.guilds.updateConfig(guildId, {
            features: {
                ...currentFeatures,
                [feature]: newValue,
            },
        });

        if (result.data) {
            setConfig(result.data);
            setMessage({ type: 'success', text: 'Settings saved!' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save' });
        }

        setSaving(false);
        setTimeout(() => setMessage(null), 3000);
    }

    if (loading) {
        return (
            <div className={styles.loader}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!config) {
        return <div className={styles.error}>Failed to load configuration</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>General Settings</h1>
                <p className={styles.subtitle}>Configure your server's bot features</p>
            </div>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Features</h2>
                <p className={styles.sectionDesc}>Enable or disable major bot features</p>

                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureInfo}>
                            <h3>🛡️ Moderation</h3>
                            <p>Warn, timeout, kick, ban, and purge commands</p>
                        </div>
                        <button
                            className={`${styles.toggle} ${config.features?.moderation ? styles.active : ''}`}
                            onClick={() => toggleFeature('moderation')}
                            disabled={saving}
                        >
                            <span className={styles.toggleKnob}></span>
                        </button>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureInfo}>
                            <h3>📋 Logging</h3>
                            <p>Log messages, mod actions, and member events</p>
                        </div>
                        <button
                            className={`${styles.toggle} ${config.features?.logging ? styles.active : ''}`}
                            onClick={() => toggleFeature('logging')}
                            disabled={saving}
                        >
                            <span className={styles.toggleKnob}></span>
                        </button>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureInfo}>
                            <h3>👋 Welcome Messages</h3>
                            <p>Greet new members in a channel or via DM</p>
                        </div>
                        <button
                            className={`${styles.toggle} ${config.features?.welcomeMessages ? styles.active : ''}`}
                            onClick={() => toggleFeature('welcomeMessages')}
                            disabled={saving}
                        >
                            <span className={styles.toggleKnob}></span>
                        </button>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureInfo}>
                            <h3>👥 Auto Roles</h3>
                            <p>Automatically assign roles to new members</p>
                        </div>
                        <button
                            className={`${styles.toggle} ${config.features?.autoRoles ? styles.active : ''}`}
                            onClick={() => toggleFeature('autoRoles')}
                            disabled={saving}
                        >
                            <span className={styles.toggleKnob}></span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Stats</h2>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{config.moderation?.modRoles?.length || 0}</span>
                        <span className={styles.statLabel}>Mod Roles</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{config.moderation?.adminRoles?.length || 0}</span>
                        <span className={styles.statLabel}>Admin Roles</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{config.commands?.disabled?.length || 0}</span>
                        <span className={styles.statLabel}>Disabled Commands</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, GuildConfig } from '@/lib/api';
import styles from '../page.module.css';

export default function LoggingPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [config, setConfig] = useState<GuildConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Channel state
    const [modLogChannel, setModLogChannel] = useState('');
    const [msgLogChannel, setMsgLogChannel] = useState('');
    const [memberLogChannel, setMemberLogChannel] = useState('');

    useEffect(() => {
        loadConfig();
    }, [guildId]);

    async function loadConfig() {
        const result = await api.guilds.getConfig(guildId);
        if (result.data) {
            setConfig(result.data);
            setModLogChannel(result.data.logging?.channels?.moderation || '');
            setMsgLogChannel(result.data.logging?.channels?.messages || '');
            setMemberLogChannel(result.data.logging?.channels?.members || '');
        }
        setLoading(false);
    }

    async function saveChannels() {
        if (!config) return;
        setSaving(true);

        const currentChannels = config.logging?.channels || {};

        const result = await api.guilds.updateConfig(guildId, {
            logging: {
                ...config.logging,
                channels: {
                    ...currentChannels,
                    moderation: modLogChannel || undefined,
                    messages: msgLogChannel || undefined,
                    members: memberLogChannel || undefined,
                },
            },
        });

        if (result.data) {
            setConfig(result.data);
            setMessage({ type: 'success', text: 'Channel settings saved!' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save' });
        }

        setSaving(false);
        setTimeout(() => setMessage(null), 3000);
    }

    async function toggleEvent(event: keyof GuildConfig['logging']['events']) {
        if (!config) return;

        setSaving(true);
        const currentEvents = config.logging?.events || {};
        const newValue = !currentEvents[event];

        const result = await api.guilds.updateConfig(guildId, {
            logging: {
                ...config.logging,
                events: { ...currentEvents, [event]: newValue },
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

    const eventDescriptions: Record<keyof GuildConfig['logging']['events'], string> = {
        messageDelete: 'Log when messages are deleted',
        messageEdit: 'Log when messages are edited',
        memberJoin: 'Log when members join the server',
        memberLeave: 'Log when members leave the server',
        modActions: 'Log moderation actions (warn, kick, ban, etc.)',
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Logging Settings</h1>
                <p className={styles.subtitle}>Configure which events are logged and where</p>
            </div>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Log Channels</h2>
                <p className={styles.sectionDesc}>Configure where logs are sent</p>

                <div className={styles.featureGrid}>
                    <div className={styles.formCard}>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>🛡️ Moderation Logs Channel ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={modLogChannel}
                                onChange={(e) => setModLogChannel(e.target.value)}
                                placeholder="Channel ID"
                            />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>💬 Message Logs Channel ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={msgLogChannel}
                                onChange={(e) => setMsgLogChannel(e.target.value)}
                                placeholder="Channel ID"
                            />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>👥 Member Logs Channel ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={memberLogChannel}
                                onChange={(e) => setMemberLogChannel(e.target.value)}
                                placeholder="Channel ID"
                            />
                        </div>
                        <button
                            className={styles.saveBtn}
                            onClick={saveChannels}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Channels'}
                        </button>
                    </div>
                </div>

                <div className={styles.infoBox}>
                    💡 Paste the Channel ID where you want logs to appear. To get a Channel ID, enable Developer Mode in Discord settings, right-click a channel, and click "Copy ID".
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Event Toggles</h2>
                <p className={styles.sectionDesc}>Enable or disable specific log events</p>

                <div className={styles.featureGrid}>
                    {(Object.keys(config.logging?.events || {}) as Array<keyof typeof config.logging.events>).map(
                        (event) => (
                            <div key={event} className={styles.featureCard}>
                                <div className={styles.featureInfo}>
                                    <h3>{event.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</h3>
                                    <p>{eventDescriptions[event]}</p>
                                </div>
                                <button
                                    className={`${styles.toggle} ${config.logging?.events?.[event] ? styles.active : ''}`}
                                    onClick={() => toggleEvent(event)}
                                    disabled={saving}
                                >
                                    <span className={styles.toggleKnob}></span>
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

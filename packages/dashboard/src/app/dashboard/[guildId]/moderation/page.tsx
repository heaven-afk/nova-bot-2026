'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, GuildConfig } from '@/lib/api';
import styles from '../page.module.css';

export default function ModerationPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [config, setConfig] = useState<GuildConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [autoTimeoutEnabled, setAutoTimeoutEnabled] = useState(false);
    const [warnThreshold, setWarnThreshold] = useState(3);
    const [timeoutDuration, setTimeoutDuration] = useState(3600);

    // New config state
    const [modRolesInput, setModRolesInput] = useState('');
    const [adminRolesInput, setAdminRolesInput] = useState('');
    const [logChannelInput, setLogChannelInput] = useState('');

    useEffect(() => {
        loadConfig();
    }, [guildId]);

    async function loadConfig() {
        const result = await api.guilds.getConfig(guildId);
        if (result.data) {
            setConfig(result.data);
            setConfig(result.data);
            setAutoTimeoutEnabled(result.data.moderation?.autoTimeout?.enabled ?? false);
            setWarnThreshold(result.data.moderation?.autoTimeout?.warnThreshold ?? 3);
            setTimeoutDuration(result.data.moderation?.autoTimeout?.duration ?? 3600);

            // Initialize inputs
            setModRolesInput(result.data.moderation?.modRoles?.join(', ') || '');
            setAdminRolesInput(result.data.moderation?.adminRoles?.join(', ') || '');
            setLogChannelInput(result.data.moderation?.logChannel || '');
        }
        setLoading(false);
    }

    async function saveSettings() {
        if (!config) return;
        setSaving(true);

        const currentMod = config.moderation || {};
        const currentAutoTimeout = currentMod.autoTimeout || {};

        // Parse roles
        const modRoles = modRolesInput.split(',').map(r => r.trim()).filter(r => r.length > 0);
        const adminRoles = adminRolesInput.split(',').map(r => r.trim()).filter(r => r.length > 0);

        const result = await api.guilds.updateConfig(guildId, {
            moderation: {
                ...currentMod,
                modRoles,
                adminRoles,
                logChannel: logChannelInput || null,
                autoTimeout: {
                    ...currentAutoTimeout,
                    enabled: autoTimeoutEnabled,
                    warnThreshold,
                    duration: timeoutDuration,
                },
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
                <h1>Moderation Settings</h1>
                <p className={styles.subtitle}>Configure moderation features and auto-moderation</p>
            </div>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Mod Roles</h2>
                <p className={styles.sectionDesc}>Roles that can use basic moderation commands (kick, warn, timeout)</p>
                <div className={styles.formCard}>
                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>Role IDs (comma separated)</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={modRolesInput}
                            onChange={(e) => setModRolesInput(e.target.value)}
                            placeholder="123456789, 987654321"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Admin Roles</h2>
                <p className={styles.sectionDesc}>Roles that can use advanced moderation commands (ban, purge, config)</p>
                <div className={styles.formCard}>
                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>Role IDs (comma separated)</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={adminRolesInput}
                            onChange={(e) => setAdminRolesInput(e.target.value)}
                            placeholder="123456789, 987654321"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Log Channel</h2>
                <p className={styles.sectionDesc}>Channel where moderation actions are logged</p>
                <div className={styles.formCard}>
                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>Channel ID</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={logChannelInput}
                            onChange={(e) => setLogChannelInput(e.target.value)}
                            placeholder="123456789"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Auto-Timeout</h2>
                <p className={styles.sectionDesc}>
                    Automatically timeout users after reaching a warning threshold
                </p>

                <div className={styles.formCard}>
                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>Enable Auto-Timeout</label>
                        <button
                            className={`${styles.toggle} ${autoTimeoutEnabled ? styles.active : ''}`}
                            onClick={() => setAutoTimeoutEnabled(!autoTimeoutEnabled)}
                        >
                            <span className={styles.toggleKnob}></span>
                        </button>
                    </div>

                    {autoTimeoutEnabled && (
                        <>
                            <div className={styles.formRow}>
                                <label className={styles.formLabel}>Warning Threshold</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={warnThreshold}
                                    onChange={(e) => setWarnThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                    min={1}
                                    max={10}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <label className={styles.formLabel}>Timeout Duration (seconds)</label>
                                <select
                                    className={styles.input}
                                    value={timeoutDuration}
                                    onChange={(e) => setTimeoutDuration(parseInt(e.target.value))}
                                >
                                    <option value={60}>1 minute</option>
                                    <option value={300}>5 minutes</option>
                                    <option value={600}>10 minutes</option>
                                    <option value={1800}>30 minutes</option>
                                    <option value={3600}>1 hour</option>
                                    <option value={86400}>1 day</option>
                                    <option value={604800}>1 week</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        className={styles.saveBtn}
                        onClick={saveSettings}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

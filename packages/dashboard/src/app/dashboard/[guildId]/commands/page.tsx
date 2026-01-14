'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, CommandConfig } from '@/lib/api';
import styles from '../page.module.css';

const COMMAND_LIST = {
    mod: ['warn', 'timeout', 'kick', 'ban', 'purge', 'warnings'],
    admin: ['config'],
    utility: ['ping', 'serverinfo', 'userinfo', 'help'],
    roles: ['role'],
};

export default function CommandsPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [config, setConfig] = useState<CommandConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, [guildId]);

    async function loadConfig() {
        const result = await api.commands.getConfig(guildId);
        if (result.data) {
            setConfig(result.data);
        }
        setLoading(false);
    }

    async function toggleCategory(category: keyof typeof COMMAND_LIST) {
        if (!config) return;

        setSaving(category);
        const currentToggles = config.categoryToggles || {};
        const newValue = !currentToggles[category];

        const result = await api.commands.updateConfig(guildId, {
            categoryToggles: {
                ...currentToggles,
                [category]: newValue,
            },
        });

        if (result.data) {
            setConfig(result.data);
            setMessage({ type: 'success', text: `${category} category ${newValue ? 'enabled' : 'disabled'}` });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save' });
        }

        setSaving(null);
        setTimeout(() => setMessage(null), 3000);
    }

    async function toggleCommand(commandName: string) {
        setSaving(commandName);

        const result = await api.commands.toggle(guildId, commandName);

        if (result.data) {
            // Update local state
            setConfig((prev) => {
                if (!prev) return prev;
                const currentDisabled = prev.disabled || [];
                const newDisabled = result.data!.enabled
                    ? currentDisabled.filter((c) => c !== commandName)
                    : [...currentDisabled, commandName];
                return { ...prev, disabled: newDisabled };
            });
            setMessage({
                type: 'success',
                text: `/${commandName} ${result.data.enabled ? 'enabled' : 'disabled'}`,
            });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to toggle' });
        }

        setSaving(null);
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
                <h1>Command Settings</h1>
                <p className={styles.subtitle}>Enable or disable command categories and individual commands</p>
            </div>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            {(Object.entries(COMMAND_LIST) as [keyof typeof COMMAND_LIST, string[]][]).map(
                ([category, commands]) => (
                    <div key={category} className={styles.section}>
                        <div className={styles.categoryHeader}>
                            <div>
                                <h2 className={styles.sectionTitle}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)} Commands
                                </h2>
                                <p className={styles.sectionDesc}>{commands.length} commands</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${config.categoryToggles?.[category] ? styles.active : ''}`}
                                onClick={() => toggleCategory(category)}
                                disabled={saving !== null}
                            >
                                <span className={styles.toggleKnob}></span>
                            </button>
                        </div>

                        {config.categoryToggles?.[category] && (
                            <div className={styles.commandGrid}>
                                {commands.map((cmd) => {
                                    const isEnabled = !config.disabled?.includes(cmd);
                                    return (
                                        <div key={cmd} className={styles.commandCard}>
                                            <span className={styles.commandName}>/{cmd}</span>
                                            <button
                                                className={`${styles.toggle} ${styles.small} ${isEnabled ? styles.active : ''}`}
                                                onClick={() => toggleCommand(cmd)}
                                                disabled={saving !== null}
                                            >
                                                <span className={styles.toggleKnob}></span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
}

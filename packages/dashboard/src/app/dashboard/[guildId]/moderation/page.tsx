'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, GuildConfig } from '@/lib/api';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { moderationSchema, ModerationConfig, moderationDefaults } from '@/lib/schemas';
import { FormSection, FormField, Toggle, Input, SaveBar, Message } from '@/components/ui';
import styles from './page.module.css';

const TIMEOUT_DURATIONS = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
    { value: 86400, label: '1 day' },
    { value: 604800, label: '1 week' },
];

export default function ModerationPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [originalConfig, setOriginalConfig] = useState<GuildConfig | null>(null);

    // For role inputs (comma-separated IDs)
    const [modRolesInput, setModRolesInput] = useState('');
    const [adminRolesInput, setAdminRolesInput] = useState('');

    const form = useSettingsForm<ModerationConfig>(moderationDefaults, {
        schema: moderationSchema,
        onSave: async (value) => {
            const result = await api.guilds.updateConfig(guildId, {
                moderation: {
                    modRoles: value.modRoles,
                    adminRoles: value.adminRoles,
                    logChannel: value.logChannel || undefined,
                    muteRole: value.muteRole || undefined,
                    autoTimeout: value.autoTimeout,
                },
            });

            if (result.data) {
                setOriginalConfig(result.data);
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
                return false;
            }
        },
    });

    const loadConfig = useCallback(async () => {
        const result = await api.guilds.getConfig(guildId);
        if (result.data) {
            setOriginalConfig(result.data);
            const moderation = result.data.moderation || moderationDefaults;

            // Set up role input strings
            const modRoles = moderation.modRoles || [];
            const adminRoles = moderation.adminRoles || [];
            setModRolesInput(modRoles.join(', '));
            setAdminRolesInput(adminRoles.join(', '));

            form.setValue({
                modRoles,
                adminRoles,
                logChannel: moderation.logChannel || '',
                muteRole: moderation.muteRole || '',
                autoTimeout: {
                    enabled: moderation.autoTimeout?.enabled ?? false,
                    warnThreshold: moderation.autoTimeout?.warnThreshold ?? 3,
                    duration: moderation.autoTimeout?.duration ?? 3600,
                },
            });
            form.markSaved();
        }
        setLoading(false);
    }, [guildId]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Parse role input strings when they change
    const handleModRolesChange = (value: string) => {
        setModRolesInput(value);
        const roles = value.split(',').map(r => r.trim()).filter(r => r.length > 0);
        form.setValue(prev => ({ ...prev, modRoles: roles }));
    };

    const handleAdminRolesChange = (value: string) => {
        setAdminRolesInput(value);
        const roles = value.split(',').map(r => r.trim()).filter(r => r.length > 0);
        form.setValue(prev => ({ ...prev, adminRoles: roles }));
    };

    const handleSave = async () => {
        const success = await form.save();
        if (success) {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCancel = () => {
        form.reset();
        // Also reset the input strings
        const moderation = originalConfig?.moderation || moderationDefaults;
        setModRolesInput((moderation.modRoles || []).join(', '));
        setAdminRolesInput((moderation.adminRoles || []).join(', '));
    };

    if (loading) {
        return (
            <div className={styles.loader}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!originalConfig) {
        return <div className={styles.error}>Failed to load configuration</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Moderation Settings</h1>
                <p className={styles.subtitle}>Configure moderation features and permissions</p>
            </div>

            {message && (
                <Message
                    type={message.type}
                    text={message.text}
                    onDismiss={() => setMessage(null)}
                />
            )}

            <FormSection title="Mod Roles" icon="🛡️" description="Roles that can use basic moderation commands (kick, warn, timeout)">
                <FormField
                    label="Role IDs"
                    description="Comma-separated list of Role IDs"
                    error={form.errors.modRoles}
                >
                    <Input
                        type="text"
                        value={modRolesInput}
                        onChange={(e) => handleModRolesChange(e.target.value)}
                        placeholder="123456789, 987654321"
                        error={!!form.errors.modRoles}
                    />
                </FormField>
            </FormSection>

            <FormSection title="Admin Roles" icon="⚙️" description="Roles that can use advanced moderation commands (ban, purge, config)">
                <FormField
                    label="Role IDs"
                    description="Comma-separated list of Role IDs"
                    error={form.errors.adminRoles}
                >
                    <Input
                        type="text"
                        value={adminRolesInput}
                        onChange={(e) => handleAdminRolesChange(e.target.value)}
                        placeholder="123456789, 987654321"
                        error={!!form.errors.adminRoles}
                    />
                </FormField>
            </FormSection>

            <FormSection title="Log Channel" icon="📋" description="Channel where moderation actions are logged">
                <FormField
                    label="Channel ID"
                    description="Where to send moderation logs"
                    error={form.errors.logChannel}
                >
                    <Input
                        type="text"
                        value={form.value.logChannel}
                        onChange={(e) => form.setValue(prev => ({ ...prev, logChannel: e.target.value }))}
                        placeholder="123456789012345678"
                        error={!!form.errors.logChannel}
                    />
                </FormField>
            </FormSection>

            <FormSection title="Auto-Timeout" icon="⏱️" description="Automatically timeout users after reaching a warning threshold">
                <Toggle
                    checked={form.value.autoTimeout.enabled}
                    onChange={(checked) => form.setValue(prev => ({
                        ...prev,
                        autoTimeout: { ...prev.autoTimeout, enabled: checked }
                    }))}
                    label="Enable Auto-Timeout"
                    description="Timeout users automatically when they reach the warning threshold"
                />

                {form.value.autoTimeout.enabled && (
                    <div className={styles.autoTimeoutSettings}>
                        <FormField
                            label="Warning Threshold"
                            description="Number of warnings before auto-timeout"
                            error={form.errors['autoTimeout.warnThreshold' as keyof ModerationConfig]}
                        >
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={form.value.autoTimeout.warnThreshold}
                                onChange={(e) => form.setValue(prev => ({
                                    ...prev,
                                    autoTimeout: { ...prev.autoTimeout, warnThreshold: parseInt(e.target.value) || 3 }
                                }))}
                            />
                        </FormField>

                        <FormField
                            label="Timeout Duration"
                            description="How long to timeout the user"
                        >
                            <select
                                className={styles.select}
                                value={form.value.autoTimeout.duration}
                                onChange={(e) => form.setValue(prev => ({
                                    ...prev,
                                    autoTimeout: { ...prev.autoTimeout, duration: parseInt(e.target.value) }
                                }))}
                            >
                                {TIMEOUT_DURATIONS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                )}
            </FormSection>

            <SaveBar
                show={form.isDirty}
                saving={form.isSaving}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </div>
    );
}

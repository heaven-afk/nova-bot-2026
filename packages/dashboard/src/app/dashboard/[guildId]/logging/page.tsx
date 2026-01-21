'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, GuildConfig } from '@/lib/api';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { loggingSchema, LoggingConfig, loggingDefaults } from '@/lib/schemas';
import { FormSection, FormField, Toggle, Input, SaveBar, Message } from '@/components/ui';
import styles from './page.module.css';

export default function LoggingPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [originalConfig, setOriginalConfig] = useState<GuildConfig | null>(null);

    // Initialize form with defaults, will be updated after loading
    const form = useSettingsForm<LoggingConfig>(loggingDefaults, {
        schema: loggingSchema,
        onSave: async (value) => {
            const result = await api.guilds.updateConfig(guildId, {
                logging: {
                    enabled: value.enabled,
                    channels: {
                        moderation: value.channels.moderation || undefined,
                        messages: value.channels.messages || undefined,
                        members: value.channels.members || undefined,
                    },
                    events: value.events,
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
            const logging = result.data.logging || loggingDefaults;
            form.setValue({
                enabled: logging.enabled ?? false,
                channels: {
                    moderation: logging.channels?.moderation || '',
                    messages: logging.channels?.messages || '',
                    members: logging.channels?.members || '',
                },
                events: {
                    messageDelete: logging.events?.messageDelete ?? true,
                    messageEdit: logging.events?.messageEdit ?? true,
                    memberJoin: logging.events?.memberJoin ?? true,
                    memberLeave: logging.events?.memberLeave ?? true,
                    modActions: logging.events?.modActions ?? true,
                },
            });
            form.markSaved(); // Mark as not dirty after loading
        }
        setLoading(false);
    }, [guildId]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async () => {
        const success = await form.save();
        if (success) {
            setTimeout(() => setMessage(null), 3000);
        }
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

    const eventLabels: Record<keyof LoggingConfig['events'], { label: string; description: string }> = {
        messageDelete: { label: 'Message Deletes', description: 'Log when messages are deleted' },
        messageEdit: { label: 'Message Edits', description: 'Log when messages are edited' },
        memberJoin: { label: 'Member Joins', description: 'Log when members join the server' },
        memberLeave: { label: 'Member Leaves', description: 'Log when members leave the server' },
        modActions: { label: 'Mod Actions', description: 'Log moderation actions (warn, kick, ban, etc.)' },
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Logging Settings</h1>
                <p className={styles.subtitle}>Configure which events are logged and where</p>
            </div>

            {message && (
                <Message
                    type={message.type}
                    text={message.text}
                    onDismiss={() => setMessage(null)}
                />
            )}

            <FormSection title="Master Toggle" icon="📋" description="Enable or disable the logging system">
                <Toggle
                    checked={form.value.enabled}
                    onChange={(checked) => form.updateField('enabled', checked)}
                    label="Enable Logging"
                    description="When disabled, no events will be logged"
                />
            </FormSection>

            {form.value.enabled && (
                <>
                    <FormSection title="Log Channels" icon="📍" description="Configure where different logs are sent">
                        <FormField
                            label="Moderation Logs Channel"
                            description="Channel for ban, kick, warn, timeout logs"
                            error={form.errors['channels.moderation' as keyof LoggingConfig]}
                        >
                            <Input
                                type="text"
                                value={form.value.channels.moderation}
                                onChange={(e) => form.setValue(prev => ({
                                    ...prev,
                                    channels: { ...prev.channels, moderation: e.target.value }
                                }))}
                                placeholder="Channel ID (e.g., 123456789012345678)"
                                error={!!form.errors['channels.moderation' as keyof LoggingConfig]}
                            />
                        </FormField>

                        <FormField
                            label="Message Logs Channel"
                            description="Channel for message edit/delete logs"
                            error={form.errors['channels.messages' as keyof LoggingConfig]}
                        >
                            <Input
                                type="text"
                                value={form.value.channels.messages}
                                onChange={(e) => form.setValue(prev => ({
                                    ...prev,
                                    channels: { ...prev.channels, messages: e.target.value }
                                }))}
                                placeholder="Channel ID (e.g., 123456789012345678)"
                                error={!!form.errors['channels.messages' as keyof LoggingConfig]}
                            />
                        </FormField>

                        <FormField
                            label="Member Logs Channel"
                            description="Channel for member join/leave logs"
                            error={form.errors['channels.members' as keyof LoggingConfig]}
                        >
                            <Input
                                type="text"
                                value={form.value.channels.members}
                                onChange={(e) => form.setValue(prev => ({
                                    ...prev,
                                    channels: { ...prev.channels, members: e.target.value }
                                }))}
                                placeholder="Channel ID (e.g., 123456789012345678)"
                                error={!!form.errors['channels.members' as keyof LoggingConfig]}
                            />
                        </FormField>

                        <div className={styles.infoBox}>
                            💡 To get a Channel ID, enable Developer Mode in Discord settings, right-click a channel, and click "Copy ID".
                        </div>
                    </FormSection>

                    <FormSection title="Event Toggles" icon="⚡" description="Choose which events to log">
                        <div className={styles.eventGrid}>
                            {(Object.keys(eventLabels) as Array<keyof LoggingConfig['events']>).map((event) => (
                                <div key={event} className={styles.eventCard}>
                                    <Toggle
                                        checked={form.value.events[event]}
                                        onChange={(checked) => form.setValue(prev => ({
                                            ...prev,
                                            events: { ...prev.events, [event]: checked }
                                        }))}
                                        label={eventLabels[event].label}
                                        description={eventLabels[event].description}
                                    />
                                </div>
                            ))}
                        </div>
                    </FormSection>
                </>
            )}

            <SaveBar
                show={form.isDirty}
                saving={form.isSaving}
                onSave={handleSave}
                onCancel={form.reset}
            />
        </div>
    );
}

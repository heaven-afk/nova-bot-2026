'use client';

import styles from './SaveBar.module.css';

interface SaveBarProps {
    show: boolean;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
    onReset?: () => void;
    saveLabel?: string;
    cancelLabel?: string;
}

export function SaveBar({
    show,
    saving,
    onSave,
    onCancel,
    onReset,
    saveLabel = 'Save Changes',
    cancelLabel = 'Cancel',
}: SaveBarProps) {
    if (!show) return null;

    return (
        <div className={styles.bar}>
            <div className={styles.content}>
                <div className={styles.message}>
                    <span className={styles.icon}>⚠️</span>
                    <span>You have unsaved changes</span>
                </div>
                <div className={styles.actions}>
                    {onReset && (
                        <button
                            type="button"
                            className={styles.resetBtn}
                            onClick={onReset}
                            disabled={saving}
                        >
                            Reset to Defaults
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={saving}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

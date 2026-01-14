import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

const DURATION_MULTIPLIERS: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
};

function parseDuration(input: string): number | null {
    const match = input.match(/^(\d+)([smhd])$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multiplier = DURATION_MULTIPLIERS[unit];

    if (!multiplier) return null;

    const seconds = value * multiplier;
    // Discord timeout max is 28 days
    if (seconds > 28 * 86400) return null;

    return seconds * 1000; // Return milliseconds
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
}

export default createCommand(
    {
        name: 'timeout',
        description: 'Timeout a user',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to timeout').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('duration')
                    .setDescription('Duration (e.g., 10m, 1h, 1d)')
                    .setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for the timeout')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const target = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        if (!target || !('timeout' in target)) {
            throw new TargetError('Could not find that member in this server.');
        }

        // Can't timeout yourself
        if (target.id === moderator.id) {
            throw new TargetError('You cannot timeout yourself.');
        }

        // Can't timeout bots
        if (target.user.bot) {
            throw new TargetError('You cannot timeout bots.');
        }

        // Check if moderatable
        if (!target.moderatable) {
            throw new TargetError('I cannot timeout this user. They may have higher permissions.');
        }

        // Parse duration
        const durationMs = parseDuration(durationStr);
        if (durationMs === null) {
            throw new TargetError('Invalid duration. Use format like 10s, 10m, 1h, or 1d (max 28d).');
        }

        await interaction.deferReply();

        // Apply timeout
        await target.timeout(durationMs, `${moderator.tag}: ${reason}`);

        const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle('User Timed Out')
            .addFields(
                { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Duration', value: formatDuration(durationMs), inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Timeout',
            moderator,
            target: target.user,
            reason,
            duration: formatDuration(durationMs),
        });
    }
);

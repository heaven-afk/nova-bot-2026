import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { api } from '../../lib/api.js';

export default createCommand(
    {
        name: 'warnings',
        description: 'View warnings for a user',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to check warnings for').setRequired(true)
            ),
    async (interaction) => {
        const target = interaction.options.getUser('user', true);

        await interaction.deferReply();

        const result = await api.getWarnings(interaction.guildId!, target.id);

        if (result.error) {
            throw new Error(`Failed to fetch warnings: ${result.error}`);
        }

        const { warnings, count } = result.data!;

        if (count === 0) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle('No Warnings')
                .setDescription(`${target.tag} has no warnings.`)
                .setThumbnail(target.displayAvatarURL());

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(`Warnings for ${target.tag}`)
            .setDescription(`Total: ${count} warning(s)`)
            .setThumbnail(target.displayAvatarURL())
            .setTimestamp();

        // Show last 10 warnings
        const recentWarnings = (warnings as any[]).slice(0, 10);
        for (const warning of recentWarnings) {
            const date = new Date(warning.createdAt).toLocaleDateString();
            embed.addFields({
                name: `⚠️ ${date} by ${warning.modTag}`,
                value: warning.reason.slice(0, 200),
            });
        }

        if (count > 10) {
            embed.setFooter({ text: `Showing 10 of ${count} warnings` });
        }

        await interaction.editReply({ embeds: [embed] });
    }
);

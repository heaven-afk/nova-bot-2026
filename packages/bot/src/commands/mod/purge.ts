import { PermissionFlagsBits, EmbedBuilder, Colors, TextChannel } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'purge',
        description: 'Delete multiple messages from a channel',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    },
    (cmd) =>
        cmd
            .addIntegerOption((opt) =>
                opt
                    .setName('amount')
                    .setDescription('Number of messages to delete (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            )
            .addUserOption((opt) =>
                opt.setName('user').setDescription('Only delete messages from this user')
            )
            .addStringOption((opt) =>
                opt.setName('contains').setDescription('Only delete messages containing this text')
            ),
    async (interaction) => {
        const amount = interaction.options.getInteger('amount', true);
        const targetUser = interaction.options.getUser('user');
        const containsText = interaction.options.getString('contains');

        const channel = interaction.channel as TextChannel;

        if (!channel || !('bulkDelete' in channel)) {
            throw new TargetError('This command can only be used in text channels.');
        }

        await interaction.deferReply({ ephemeral: true });

        // Fetch messages
        const messages = await channel.messages.fetch({ limit: 100 });

        // Filter messages
        let filtered = messages.filter((msg) => {
            // Can't delete messages older than 14 days
            if (Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000) {
                return false;
            }

            // Filter by user if specified
            if (targetUser && msg.author.id !== targetUser.id) {
                return false;
            }

            // Filter by content if specified
            if (containsText && !msg.content.toLowerCase().includes(containsText.toLowerCase())) {
                return false;
            }

            return true;
        });

        // Limit to requested amount - first() returns an array
        const toDelete = filtered.first(amount);

        if (toDelete.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Yellow)
                .setDescription('No messages found matching the criteria.');

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Delete messages
        const deleted = await channel.bulkDelete(toDelete, true);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Messages Purged')
            .setDescription(`Successfully deleted ${deleted.size} message(s).`)
            .setTimestamp();

        if (targetUser) {
            embed.addFields({ name: 'User Filter', value: targetUser.tag, inline: true });
        }

        if (containsText) {
            embed.addFields({ name: 'Content Filter', value: containsText, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });
    }
);

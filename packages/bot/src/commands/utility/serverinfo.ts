import { EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'serverinfo',
        description: 'Get information about the server',
        category: 'utility',
    },
    (cmd) => cmd,
    async (interaction) => {
        const guild = interaction.guild!;

        await interaction.deferReply();

        // Fetch more data
        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: 'Owner', value: owner.user.tag, inline: true },
                { name: 'Members', value: guild.memberCount.toString(), inline: true },
                { name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
                {
                    name: 'Channels',
                    value: `${channels.filter((c) => c.isTextBased()).size} text, ${channels.filter((c) => c.isVoiceBased()).size} voice`,
                    inline: true,
                },
                { name: 'Roles', value: roles.size.toString(), inline: true },
                {
                    name: 'Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                    inline: true,
                }
            )
            .setFooter({ text: `ID: ${guild.id}` })
            .setTimestamp();

        if (guild.description) {
            embed.setDescription(guild.description);
        }

        await interaction.editReply({ embeds: [embed] });
    }
);

import { EmbedBuilder, Colors, GuildMember } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'userinfo',
        description: 'Get information about a user',
        category: 'utility',
    },
    (cmd) =>
        cmd.addUserOption((opt) =>
            opt.setName('user').setDescription('The user to get info about')
        ),
    async (interaction) => {
        const target = interaction.options.getMember('user') || interaction.member;

        if (!target || !(target instanceof GuildMember)) {
            await interaction.reply({
                content: 'Could not find that user.',
                ephemeral: true,
            });
            return;
        }

        const user = target.user;

        const embed = new EmbedBuilder()
            .setColor(target.displayColor || Colors.Blurple)
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Nickname', value: target.nickname || 'None', inline: true },
                {
                    name: 'Account Created',
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: 'Joined Server',
                    value: target.joinedTimestamp
                        ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`
                        : 'Unknown',
                    inline: true,
                },
                {
                    name: `Roles (${target.roles.cache.size - 1})`,
                    value:
                        target.roles.cache
                            .filter((r) => r.id !== interaction.guildId)
                            .map((r) => `<@&${r.id}>`)
                            .slice(0, 10)
                            .join(', ') || 'None',
                }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        if (user.banner) {
            embed.setImage(user.bannerURL({ size: 512 })!);
        }

        await interaction.reply({ embeds: [embed] });
    }
);

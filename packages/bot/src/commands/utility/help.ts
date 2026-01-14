import { EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'help',
        description: 'Show available commands',
        category: 'utility',
    },
    (cmd) =>
        cmd.addStringOption((opt) =>
            opt.setName('command').setDescription('Get help for a specific command')
        ),
    async (interaction, client) => {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            // Show specific command help
            const command = client.commands.get(commandName);

            if (!command) {
                await interaction.reply({
                    content: `Command \`${commandName}\` not found.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.Blurple)
                .setTitle(`/${command.data.name}`)
                .setDescription(command.data.description)
                .addFields(
                    { name: 'Category', value: command.options.category, inline: true },
                    {
                        name: 'Cooldown',
                        value: command.options.cooldown ? `${command.options.cooldown}s` : 'None',
                        inline: true,
                    }
                );

            if (command.options.modOnly) {
                embed.addFields({ name: 'Requires', value: 'Moderator role', inline: true });
            }

            if (command.options.adminOnly) {
                embed.addFields({ name: 'Requires', value: 'Administrator role', inline: true });
            }

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // Show all commands by category
        const categories = new Map<string, string[]>();

        client.commands.forEach((cmd) => {
            const cat = cmd.options.category;
            if (!categories.has(cat)) {
                categories.set(cat, []);
            }
            categories.get(cat)!.push(cmd.data.name);
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('📚 Commands')
            .setDescription('Use `/help <command>` for detailed information.')
            .setTimestamp();

        const categoryEmojis: Record<string, string> = {
            mod: '🛡️',
            admin: '⚙️',
            utility: '🔧',
            roles: '👥',
        };

        categories.forEach((commands, category) => {
            const emoji = categoryEmojis[category] || '📁';
            embed.addFields({
                name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                value: commands.map((c) => `\`${c}\``).join(', '),
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
);

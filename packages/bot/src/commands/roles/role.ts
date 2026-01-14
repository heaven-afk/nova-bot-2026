import { PermissionFlagsBits, EmbedBuilder, Colors, GuildMember } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'role',
        description: 'Manage roles for a user',
        category: 'roles',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    },
    (cmd) =>
        cmd
            .addSubcommand((sub) =>
                sub
                    .setName('add')
                    .setDescription('Add a role to a user')
                    .addUserOption((opt) =>
                        opt.setName('user').setDescription('The user').setRequired(true)
                    )
                    .addRoleOption((opt) =>
                        opt.setName('role').setDescription('The role to add').setRequired(true)
                    )
            )
            .addSubcommand((sub) =>
                sub
                    .setName('remove')
                    .setDescription('Remove a role from a user')
                    .addUserOption((opt) =>
                        opt.setName('user').setDescription('The user').setRequired(true)
                    )
                    .addRoleOption((opt) =>
                        opt.setName('role').setDescription('The role to remove').setRequired(true)
                    )
            ),
    async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getMember('user');
        const role = interaction.options.getRole('role', true);

        if (!target || !('roles' in target)) {
            throw new TargetError('Could not find that member.');
        }

        // Cast to GuildMember after type guard
        const targetMember = target as GuildMember;

        // Check if role is manageable
        const botMember = interaction.guild!.members.me!;
        if (role.position >= botMember.roles.highest.position) {
            throw new TargetError('I cannot manage this role. It is higher than my highest role.');
        }

        // Check if user can manage the role
        const invokerMember = interaction.member as GuildMember;
        if (role.position >= invokerMember.roles.highest.position && interaction.guild!.ownerId !== invokerMember.id) {
            throw new TargetError('You cannot manage this role. It is higher than your highest role.');
        }

        await interaction.deferReply();

        if (subcommand === 'add') {
            if (targetMember.roles.cache.has(role.id)) {
                throw new TargetError(`${targetMember.user.tag} already has this role.`);
            }

            await targetMember.roles.add(role.id, `Added by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle('Role Added')
                .setDescription(`Added <@&${role.id}> to ${targetMember.user.tag}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            if (!targetMember.roles.cache.has(role.id)) {
                throw new TargetError(`${targetMember.user.tag} does not have this role.`);
            }

            await targetMember.roles.remove(role.id, `Removed by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Role Removed')
                .setDescription(`Removed <@&${role.id}> from ${targetMember.user.tag}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
);

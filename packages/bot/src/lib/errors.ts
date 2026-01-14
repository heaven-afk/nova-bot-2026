import { EmbedBuilder, Colors, ChatInputCommandInteraction } from 'discord.js';

export class CommandError extends Error {
    constructor(
        message: string,
        public readonly userMessage: string = message,
        public readonly ephemeral: boolean = true
    ) {
        super(message);
        this.name = 'CommandError';
    }
}

export class PermissionError extends CommandError {
    constructor(message = 'You do not have permission to use this command.') {
        super(message, message, true);
        this.name = 'PermissionError';
    }
}

export class CooldownError extends CommandError {
    constructor(public readonly remainingSeconds: number) {
        super(
            `Command on cooldown`,
            `Please wait ${remainingSeconds.toFixed(1)} seconds before using this command again.`,
            true
        );
        this.name = 'CooldownError';
    }
}

export class FeatureDisabledError extends CommandError {
    constructor(feature: string) {
        super(
            `Feature disabled: ${feature}`,
            `This feature is disabled in this server.`,
            true
        );
        this.name = 'FeatureDisabledError';
    }
}

export class TargetError extends CommandError {
    constructor(message: string) {
        super(message, message, true);
        this.name = 'TargetError';
    }
}

export async function handleCommandError(
    interaction: ChatInputCommandInteraction,
    error: unknown
): Promise<void> {
    console.error(`Command error in ${interaction.commandName}:`, error);

    let embed: EmbedBuilder;

    if (error instanceof CommandError) {
        embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('Error')
            .setDescription(error.userMessage);
    } else {
        embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('An error occurred')
            .setDescription('An unexpected error occurred while executing this command.');
    }

    const ephemeral = error instanceof CommandError ? error.ephemeral : true;

    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral });
        }
    } catch (replyError) {
        console.error('Failed to send error response:', replyError);
    }
}

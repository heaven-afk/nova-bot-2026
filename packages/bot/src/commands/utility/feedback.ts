import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'feedback',
        description: 'Submit feedback about the bot',
        category: 'utility',
    },
    (cmd) => cmd,
    async (interaction) => {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('feedback')
            .setTitle('📝 Submit Feedback');

        // Feedback type input
        const typeInput = new TextInputBuilder()
            .setCustomId('feedback_type')
            .setLabel('Feedback Type')
            .setPlaceholder('Bug Report / Feature Request / General')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50)
            .setRequired(true);

        // Feedback content input
        const feedbackInput = new TextInputBuilder()
            .setCustomId('feedback_input')
            .setLabel('Your Feedback')
            .setPlaceholder('Please describe your feedback in detail...')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(1000)
            .setRequired(true);

        // Create action rows for each input
        const typeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(typeInput);
        const feedbackRow = new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput);

        // Add inputs to modal
        modal.addComponents(typeRow, feedbackRow);

        // Show the modal
        await interaction.showModal(modal);
    }
);

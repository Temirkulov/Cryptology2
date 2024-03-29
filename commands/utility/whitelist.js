// commands/whitelist.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Whitelist a user to react to profile messages')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the user to whitelist')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('id');
        // Update the whitelist here (e.g., adding the user ID to a database or in-memory store)
        
        interaction.reply({ content: `User ${userId} has been whitelisted.`, ephemeral: true });
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addfranchise')
        .setDescription('Adds a new franchise with specified perks')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the franchise')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('work')
                .setDescription('Work bonus percentage (0-100), e.g., for 80% enter 80')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('tips')
                .setDescription('Tips bonus percentage (0-100), e.g., for 80% enter 80')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('overtime')
                .setDescription('Overtime bonus percentage (0-150), e.g., for 150% enter 150')
                .setRequired(true)),
    
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        // Replace "YOUR_USER_ID" with your actual Discord user ID
        const myUserID = "348296915143884801";
        if (interaction.user.id !== myUserID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const name = interaction.options.getString('name');
        const work = interaction.options.getInteger('work') / 100;  // Convert percentage to decimal
        const tips = interaction.options.getInteger('tips') / 100;  // Convert percentage to decimal
        const overtime = interaction.options.getInteger('overtime') / 100;  // Convert percentage to decimal

        // Validate input ranges
        if (work < 0 || work > 1 || tips < 0 || tips > 1 || overtime < 0 || overtime > 1.5) {
            return interaction.reply({ content: 'Please ensure percentages are within the correct range: Work and Tips (0-100), Overtime (0-150).', ephemeral: true });
        }

        // Save to database
        await db.set(`franchise_${name}`, { work, tips, overtime });

        return interaction.reply({ content: `Franchise ${name} added with Work: ${work}, Tips: ${tips}, Overtime: ${overtime}`, ephemeral: false });
    }
};

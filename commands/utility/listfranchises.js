const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listallfranchises')
        .setDescription('Lists all the franchises in the database (owner only)'),

    async execute(interaction) {
        const myUserID = "348296915143884801"; // Your Discord user ID
        if (interaction.user.id !== myUserID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const keys = await db.keys('franchise_*');
        if (keys.length === 0) {
            return interaction.reply({ content: 'No franchises found in the database.', ephemeral: true });
        }

        let response = '**Franchises:**\n';
        for (const key of keys) {
            const franchise = await db.get(key);
            response += `**${key.replace('franchise_', '')}:** Income $${franchise.income}, Work x${franchise.work}, Tips x${franchise.tips}, Overtime x${franchise.overtime}\n`;
        }

        // Ensure the message does not exceed Discord's character limit for a single message.
        if (response.length >= 2000) {
            // Split the response into manageable chunks, or consider sending multiple messages or using follow-up messages
            response = response.substring(0, 1997) + '...'; // Simple example to truncate long messages
        }

        await interaction.reply({ content: response, ephemeral: true });
    }
};

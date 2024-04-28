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

        // Fetch all data from the database and ensure it is properly formatted
        const allData = await db.all();
        let franchiseData = [];
        for (const item of allData) {
            // Ensure each item has an ID and it starts with 'franchise_'
            if (item.ID && item.ID.startsWith('franchise_')) {
                franchiseData.push({ key: item.ID, data: item.value });
            }
        }

        if (!franchiseData.length) {
            return interaction.reply({ content: 'No franchises found in the database.', ephemeral: true });
        }

        let response = '**Franchises:**\n';
        for (const data of franchiseData) {
            const key = data.key;
            const franchise = data.data;
            response += `**${key.replace('franchise_', '')}:** Income $${franchise.income}, Work x${franchise.work}, Tips x${franchise.tips}, Overtime x${franchise.overtime}\n`;
        }

        // Check for response length to avoid exceeding Discord's limit
        if (response.length >= 2000) {
            response = response.substring(0, 1997) + '...';
        }

        await interaction.reply({ content: response, ephemeral: true });
    }
};

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listallfranchises')
        .setDescription('Lists all the franchises in the database (owner only)'),
    
    async execute(interaction) {
        const myUserID = "348296915143884801"; // Your Discord user ID
        if (interaction.user.id !== myUserID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const db = new QuickDB();
        const keys = await db.keys('franchise_*');
        if (keys.length === 0) {
            return interaction.reply({ content: 'No franchises found in the database.', ephemeral: true });
        }

        let response = 'Franchises:\n';
        for (const key of keys) {
            const franchise = await db.get(key);
            response += `**${key.replace('franchise_', '')}:** Income $${franchise.income}, Work x${franchise.workMultiplier}, Tips x${franchise.tipsMultiplier}, Overtime x${franchise.overtimeMultiplier}\n`;
        }

        await interaction.reply({ content: response, ephemeral: true });
    }
};

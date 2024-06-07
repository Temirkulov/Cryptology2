const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comparedata')
        .setDescription('Compare data between two snapshots.')
        .addStringOption(option =>
            option.setName('id1')
                .setDescription('First snapshot ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('id2')
                .setDescription('Second snapshot ID')
                .setRequired(true)),
    async execute(interaction) {
        const id1 = interaction.options.getString('id1').trim();
        const id2 = interaction.options.getString('id2').trim();

        // Validate IDs: Ensure they are 5 characters long and alphanumeric
        const idRegex = /^[a-zA-Z0-9]{5}$/;
        if (!idRegex.test(id1) || !idRegex.test(id2)) {
            await interaction.reply({ content: 'Error: Each ID must be a 5-character alphanumeric string.', ephemeral: true });
            return;
        }

        const userId = interaction.user.id;

        try {
            // Retrieve user snapshots from the database
            const userStats = await db.get(`shackData.${userId}.stats`);
            if (!userStats || userStats.length === 0) {
                await interaction.reply({ content: 'Error: No snapshots found for your account.', ephemeral: true });
                return;
            }

            // Find the snapshots by ID
            const snapshot1 = userStats.find(snapshot => snapshot.id === id1);
            const snapshot2 = userStats.find(snapshot => snapshot.id === id2);

            // Check if both snapshots exist
            if (!snapshot1 || !snapshot2) {
                await interaction.reply({ content: 'Error: One or both snapshot IDs do not exist.', ephemeral: true });
                return;
            }

            // Function to safely access nested properties and handle undefined values
            const safeAccess = (obj, key) => obj?.data[key] || 'N/A';

            // Generate comparison embed
            const compareEmbed = new EmbedBuilder()
                .setTitle("Snapshot Comparison")
                .setDescription(`Comparison between Snapshot \`${id1}\` and Snapshot \`${id2}\``)
                .addFields(
                    { name: 'Shifts Worked', value: `${safeAccess(snapshot1, 'shiftsworked')} ➡️ ${safeAccess(snapshot2, 'shiftsworked')}`, inline: true },
                    { name: 'Tips Collected', value: `${safeAccess(snapshot1, 'tipscollected')} ➡️ ${safeAccess(snapshot2, 'tipscollected')}`, inline: true },
                    { name: 'Overtime Shifts', value: `${safeAccess(snapshot1, 'overtimes')} ➡️ ${safeAccess(snapshot2, 'overtimes')}`, inline: true },
                    { name: 'Daily Gifts Collected', value: `${safeAccess(snapshot1, 'dailygiftscollected')} ➡️ ${safeAccess(snapshot2, 'dailygiftscollected')}`, inline: true },
                    { name: 'Total Votes', value: `${safeAccess(snapshot1, 'totalvotes')} ➡️ ${safeAccess(snapshot2, 'totalvotes')}`, inline: true },
                    { name: 'Tasks Completed', value: `${safeAccess(snapshot1, 'taskscompleted')} ➡️ ${safeAccess(snapshot2, 'taskscompleted')}`, inline: true },
                    { name: 'Franchise Donations', value: `$${safeAccess(snapshot1, 'franchisedonations').toLocaleString()} ➡️ $${safeAccess(snapshot2, 'franchisedonations').toLocaleString()}`, inline: true },
                    { name: 'Total Gambles', value: `${safeAccess(snapshot1, 'totalgambles')} ➡️ ${safeAccess(snapshot2, 'totalgambles')}`, inline: true },
                    { name: 'Gambling Winnings', value: `$${safeAccess(snapshot1, 'gamblingwinnings').toLocaleString()} ➡️ $${safeAccess(snapshot2, 'gamblingwinnings').toLocaleString()}`, inline: true },
                    { name: 'Gambling Losses', value: `$${safeAccess(snapshot1, 'gamblinglosses').toLocaleString()} ➡️ $${safeAccess(snapshot2, 'gamblinglosses').toLocaleString()}`, inline: true },
                    { name: 'Gifts Sent', value: `${safeAccess(snapshot1, 'giftssent')} ➡️ ${safeAccess(snapshot2, 'giftssent')}`, inline: true },
                    { name: 'Gifts Received', value: `${safeAccess(snapshot1, 'giftsreceived')} ➡️ ${safeAccess(snapshot2, 'giftsreceived')}`, inline: true }
                )
                .setColor('#FEFFA3');

            await interaction.reply({ embeds: [compareEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error comparing snapshots:', error);
            await interaction.reply({ content: 'An error occurred while comparing snapshots. Please try again later.', ephemeral: false });
        }
    }
};

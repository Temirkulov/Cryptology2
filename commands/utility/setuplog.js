const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplog')
        .setDescription('Setup log and leaderboard channels')
        .addChannelOption(option => 
            option.setName('logchannel')
                .setDescription('Select the channel for log activities')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('leaderboardchannel')
                .setDescription('Select the channel for the leaderboard')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const logChannel = interaction.options.getChannel('logchannel');
        const leaderboardChannel = interaction.options.getChannel('leaderboardchannel');

        await db.set(`guild_${interaction.guildId}_logChannel`, logChannel.id);
        await db.set(`guild_${interaction.guildId}_leaderboardChannel`, leaderboardChannel.id);

        // Here you would save these settings to your database
        // For example:
        // await database.saveSettings(interaction.guildId, { logChannelId: logChannel.id, leaderboardChannelId: leaderboardChannel.id });

        // Confirm the action to the user
        await interaction.reply({
            content: `Log channel set to ${logChannel.name} and leaderboard channel set to ${leaderboardChannel.name}.`,
            ephemeral: false
        });
    },
};

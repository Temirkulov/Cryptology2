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
                .setRequired(true))
        .addStringOption(option =>
            option.setName('interval')
                .setDescription('Select the reset interval')
                .setRequired(true)
                .addChoices(
                    { name: 'Daily', value: 'daily' },
                    { name: 'Weekly', value: 'weekly' },
                    { name: 'Monthly', value: 'monthly' },
                    { name: 'Yearly', value: 'yearly' }
                )),
    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const logChannel = interaction.options.getChannel('logchannel');
        const leaderboardChannel = interaction.options.getChannel('leaderboardchannel');
        const interval = interaction.options.getString('interval');

        await db.set(`guild_${interaction.guildId}_logChannel`, logChannel.id);
        await db.set(`guild_${interaction.guildId}_leaderboardChannel`, leaderboardChannel.id);
        await db.set(`guild_${interaction.guildId}_interval`, interval);

        // Save the guild ID
        let guilds = await db.get('guilds');
        if (!guilds) guilds = [];
        if (!guilds.includes(interaction.guildId)) {
            guilds.push(interaction.guildId);
            await db.set('guilds', guilds);
        }

        // Confirm the action to the user
        await interaction.reply({
            content: `Log channel set to ${logChannel.name}, leaderboard channel set to ${leaderboardChannel.name}, and reset interval set to ${interval}.`,
            ephemeral: false
        });
    },
};

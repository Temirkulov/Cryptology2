const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const donatorPacks = require('../../utils/TacoShack/donatorPacks.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlog')
        .setDescription('Set up monitoring for your account.')
        .addChannelOption(option =>
            option.setName('balancechannel')
                .setDescription('The channel to post the balance data.')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('statschannel')
                .setDescription('The channel to post the stats data.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('shackname')
                .setDescription('The shack name to monitor.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('donatorstatus')
                .setDescription('Your donator status.')
                .setRequired(true)
                .addChoices(
                    { name: 'None', value: 'None' },
                    { name: 'Gordon Ramsey', value: 'Gordon Ramsey' },
                    { name: 'Executive Chef', value: 'Executive Chef' },
                    { name: 'Head Chef', value: 'Head Chef' },
                    { name: 'Sous Chef', value: 'Sous Chef' },
                    { name: 'Apprentice Chef', value: 'Apprentice Chef' }
                )),
    async execute(interaction) {
        const user = interaction.user; // Use the interaction user
        const balanceChannel = interaction.options.getChannel('balancechannel');
        const statsChannel = interaction.options.getChannel('statschannel');
        const shackName = interaction.options.getString('shackname').trim();
        const donatorStatus = interaction.options.getString('donatorstatus');
        const guildId = interaction.guildId;
        const userId = user.id;
        const balanceChannelId = balanceChannel.id;
        const statsChannelId = statsChannel.id;
        const avatarUrl = user.displayAvatarURL({ format: 'png' });

        // Check if the user has admin permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Check if the channels are text-based
        if (!balanceChannel.isTextBased() || !statsChannel.isTextBased()) {
            return interaction.reply({ content: 'Please specify text-based channels for logging and stats.', ephemeral: true });
        }

        try {
            // Save monitoring data to the database
            const monitorData = {
                userId: userId,
                username: user.username,
                shackName: shackName,
                balanceChannelId: balanceChannelId,
                statsChannelId: statsChannelId,
                donatorStatus: donatorStatus,
                avatarUrl: avatarUrl
            };

            await db.set(`monitor_${guildId}_${userId}`, monitorData);

            const embed = new EmbedBuilder()
                .setTitle('Monitoring Setup')
                .setDescription(`Your account (${shackName}) will be monitored.\nBalances will be posted in <#${balanceChannelId}>.\nStats will be posted in <#${statsChannelId}>.`)
                .setColor('#FFFFF0');

            await interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Error setting up monitoring:', error);
            await interaction.reply({ content: 'An error occurred while setting up monitoring. Please try again later.', ephemeral: true });
        }
    }
};

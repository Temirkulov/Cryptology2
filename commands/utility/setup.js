const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { defaultShackData } = require('../../utils/TacoShack/shackDataStructure');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup your profile for Cryptology 2.')
        .addStringOption(option =>
            option.setName('reminders')
                .setDescription('Enable or disable reminders')
                .setRequired(true)
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                )),

    async execute(interaction) {
        const remindersOption = interaction.options.getString('reminders');
        const remindersEnabled = remindersOption === 'on';

        let userData = await db.get(`shackData.${interaction.user.id}`);
        if (!userData) {
            userData = JSON.parse(JSON.stringify(defaultShackData)); // Deep clone the default data
        }
        
        userData.info.userid = interaction.user.id;
        userData.info.username = interaction.user.username;
        userData.reminders = remindersEnabled;
        
        await db.set(`shackData.${interaction.user.id}`, userData);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Account Setup Confirmation')
            .setDescription('Your account has been set up successfully with your selected preferences.')
            .addFields(
                { name: 'User ID', value: interaction.user.id, inline: true },
                { name: 'Username', value: interaction.user.username, inline: true },
                { name: 'Timer Reminders', value: remindersEnabled ? 'Enabled' : 'Disabled', inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

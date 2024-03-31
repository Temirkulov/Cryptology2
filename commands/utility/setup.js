const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { defaultShackData } = require('../../utils/TacoShack/shackDataStructure');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup your account for use in data collection')
        .addStringOption(option =>
            option.setName('confirm')
                .setDescription('Confirm setup with yes')
                .setRequired(true)),
    async execute(interaction) {
        // Assuming 'yes' is the expected confirmation value
        const confirmation = interaction.options.getString('confirm');
        if (confirmation.toLowerCase() !== 'yes') {
            await interaction.reply({ content: 'Setup not confirmed. Please confirm with yes.', ephemeral: true });
            return;
        }

        const userId = interaction.user.id;
        const userName = interaction.user.username;

        // Example of setting up the user data structure
        let userData = await db.get(`shackData.${userId}`);

        // If userData doesn't exist, initialize it using your default data structure
        if (!userData) {
            // Assuming you have a default data structure for new users
            // This could be defined elsewhere in your code
            userData = JSON.parse(JSON.stringify(defaultShackData)); // Assuming defaultShackData is your default structure
        }
        userData.info.userid = userId;
        userData.info.username = userName;
        // Saving the structure to the database under the user's ID
        await db.set(`shackData.${userId}`, userData);

        // Example of embedding the user's ID and username in the confirmation message
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Account Setup Confirmation')
            .setDescription('Your account has been set up successfully for data collection.')
            .addFields(
                { name: 'User ID', value: userId, inline: true },
                { name: 'Username', value: userName, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

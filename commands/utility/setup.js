const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

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
        let userData = {
            info: {
                username: userName, // Directly from the Discord User object
                userid: userId,
                shackName: "",
                level: 0, // To be updated based on field
                franchiseStatus: "employee", // Default status, updated based on field value
                activeLocation: "",
            },
            location: {
            }
        };
        
        // Saving the structure to the database under the user's ID
        await db.set(`userData.${userId}`, userData);

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

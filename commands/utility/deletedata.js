const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletedata')
        .setDescription('Deletes all data related to you.'),
    async execute(interaction) {
        // Assuming you have a userId associated with the interaction
        const userId = interaction.user.id;

        // Call a function to delete the user's data
        try {
            await deleteUserData(userId);
            await interaction.reply('Your data has been successfully deleted.');
        } catch (error) {
            console.error('Error deleting user data:', error);
            await interaction.reply('There was an error trying to delete your data. Please try again later.');
        }
    },
};

async function deleteUserData(userId) {
    // Implementation of this function depends on how you store user data.
    // This is where you'd include logic to remove the user's data from your database or file system.
    console.log(`Deleting data for user ID: ${userId}`);
    await db.delete(`shackData.${userId}`);
    // For example, if using MongoDB:
    // await db.collection('users').deleteOne({ userId: userId });
}

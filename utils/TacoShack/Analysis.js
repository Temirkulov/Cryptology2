const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    analysisHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            // Check if the interaction is a button press and for the 'analysis' custom ID
            if (interaction.isButton() && interaction.customId === 'analysis') {
                // Your analysis handling logic here
                // Respond to the interaction
                interaction.reply({ content: 'This is the Analysis response.', ephemeral: false });
            }
        });
    }
};

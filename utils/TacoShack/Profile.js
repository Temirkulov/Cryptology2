const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    profileHandler: function (client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
    
        if (interaction.customId === 'profile') {
            // Your logic for handling the 'profile' button click
            const savedShackData = await db.get(`shackData.${interaction.user.id}`);
            if (!savedShackData) {
                console.log("No data found for user:", interaction.user.username);
                // You might want to send a message to the user indicating no data was found
                return;
            }
            const activeLocation = savedShackData.info.activeLocation;
            console.log(activeLocation);
            const locationData = savedShackData[activeLocation]; // E.g., savedShackData.city
            const avatarUrl = interaction.user.avatarURL() || interaction.user.defaultAvatarURL;
            // Assuming you have a function to create an embed from user data
            if (locationData) {
                const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('Profile Results')
                .setDescription(`details of current upgrades`)
                .setThumbnail(avatarUrl)
                Object.entries(locationData.info).forEach(([key, value]) => {
                    embed.addFields({ name: key.charAt(0).toUpperCase() + key.slice(1), value: value.toString(), inline: true });
                });
                Object.entries(locationData.upgrades).forEach(([upgradeName, upgradeDetails]) => {
                    // Assume upgradeDetails is an object or string, adjust as necessary
                    embed.addFields({ name: upgradeName, value: `Details: ${upgradeDetails}`, inline: true });
                });                
                
                await interaction.reply({ embeds: [embed], ephemeral: false });
            } else {
                interaction.reply(`no Data available! Run /setup again!`)
            }
        }
    });
    }
}   
    
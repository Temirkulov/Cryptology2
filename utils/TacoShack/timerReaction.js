const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const reminderManager = require('./reminderManager'); // Adjust the path as necessary

function parseCooldown(value) {
    // Parse the cooldown value from the field value string
    // Implementation depends on the format of `value`
    return parseInt(value.split(' ')[1]); // Placeholder
}

function getDonatorTimeReduction(donatorRank) {
    // Returns time reduction based on the donator rank
    switch (donatorRank) {
        case 'Gordon Ramsey': return 4;
        case 'Executive Chef': return 3;
        case 'Head Chef': return 2;
        case 'Sous Chef': return 1;
        default: return 0;
    }
}

function formatCooldown(minutes) {
    // Format minutes into a human-readable string
    return minutes > 60 ? `${Math.floor(minutes / 60)} hours ${minutes % 60} minutes` : `${minutes} minutes`;
}

function calculateCooldown(name, currentValue, donatorRank, userData) {
    let cooldownTime = parseCooldown(currentValue);
    switch (name) {
        case 'Work':
        case 'Tips':
            cooldownTime -= getDonatorTimeReduction(donatorRank);
            cooldownTime -= userData.serverBonus || 0;
            break;
        case 'Overtime':
            cooldownTime = 30; // Overtime fixed to 30 mins
            break;
        case 'Clean':
            cooldownTime = 1440; // Clean fixed to 24 hours
            break;
        case 'Daily':
            cooldownTime = 1440; // Daily fixed to 24 hours
            break;
        case 'Vote':
            cooldownTime = 720; // Vote fixed to 12 hours
            break;
        default:
            break;
    }
    return formatCooldown(cooldownTime);
}


module.exports = {
    timerReactionHandler: async function(client) {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            const userId = interaction.user.id;
            const userData = await db.get(`shackData.${userId}`) || {};

            if (['enable_reminders', 'disable_reminders'].includes(interaction.customId)) {
                await interaction.deferUpdate();

                const embedData = await db.get(`cooldownEmbed_${userId}`);
                if (!embedData) {
                    return interaction.followUp({ content: "Cooldown data not found.", ephemeral: true });
                }

                userData.reminders = interaction.customId === 'enable_reminders';
                await db.set(`shackData.${userId}`, userData);

                if (userData.reminders) {
                    // Process enabling reminders
                    reminderManager.enableReminders(userId, embedData);
                } else {
                    // Process disabling reminders
                    reminderManager.disableReminders(userId);
                }

                // Prepare a response message depending on the action taken
                const messageContent = userData.reminders ?
                    "Reminders have been enabled. You'll be notified as per the cooldown times." :
                    "Reminders have been disabled. You will no longer receive notifications.";

                await interaction.followUp({ content: messageContent, ephemeral: true });
            }
        });
    }
};

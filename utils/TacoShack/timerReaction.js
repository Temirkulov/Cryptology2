const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

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

                // Fetch stored embed data or fetch the message again if needed
                const embedData = await db.get(`cooldownEmbed_${userId}`); // Assuming you've stored it before
                if (!embedData) {
                    return interaction.followUp({ content: "Cooldown data not found.", ephemeral: true });
                }

                const remindersEnabled = interaction.customId === 'enable_reminders';
                userData.reminders = remindersEnabled;
                await db.set(`shackData.${userId}`, userData);

                const fields = embedData.fields; // Assuming fields are stored in embedData
                const donatorRank = userData.info.donatorRank || 'None';

                if (remindersEnabled) {
                    const updatedFields = fields.map(field => {
                        const { name, value } = field;
                        let newValue = value.includes('READY') ? '✅ **READY**' : calculateCooldown(name, value, donatorRank, userData);
                        return { name, value: `Current: ${value}\nNext: ${newValue}`, inline: field.inline };
                    });

                    const reminderEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Cooldown Reminder Setup Complete')
                        .setDescription(`Reminders have been configured. Your current Donator Rank: ${donatorRank}`)
                        .addFields(updatedFields)
                        .setFooter({ text: 'Timers will be reminded as per the calculated cooldown durations.' });

                    await interaction.editReply({ embeds: [reminderEmbed], components: [] });
                } else {
                    const noReminderEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Cooldown Reminders Disabled')
                        .setDescription('You will not receive reminders for your cooldowns.')
                        .setFooter({ text: 'You can enable reminders anytime by reacting to the cooldown messages.' });

                    await interaction.editReply({ embeds: [noReminderEmbed], components: [] });
                }
            }
        });
    }
};


const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { defaultShackData } = require('../../utils/TacoShack/shackDataStructure');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup your profile for Cryptology 2.'),

    async execute(interaction) {
        const userData = await db.get(`shackData.${interaction.user.id}`) || null;

        // If data is already present, update it
        if (userData) {
            // You can customize the response if the user has already configured settings
            return await interaction.reply({
                content: "Your profile is already set up! You can use another command to update your settings.",
                ephemeral: true
            });
        }

        // Initial interaction asking for timer reminder setup
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('enable_reminders')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Success),  // Correct usage of ButtonStyle enum
                new ButtonBuilder()
                    .setCustomId('disable_reminders')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger)   // Correct usage of ButtonStyle enum
            );

        await interaction.reply({ 
            content: 'Do you wish to receive timer reminders?', 
            components: [row], 
            ephemeral: true 
        });

        // Set up a collector to handle the button interaction
        const collector = interaction.channel.createMessageComponentCollector({
            time: 15000 // 15 seconds to respond
        });

        collector.on('collect', async i => {
            if (i.user.id === interaction.user.id) {
                await i.deferUpdate();
                const remindersEnabled = i.customId === 'enable_reminders';
                
                // Ask for confirmation to complete the setup
                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_setup')
                            .setLabel('Confirm Setup')
                            .setStyle(ButtonStyle.Primary)  // Correct usage of ButtonStyle enum
                    );

                await i.editReply({
                    content: `You have chosen to ${remindersEnabled ? 'enable' : 'disable'} timer reminders. Click 'Confirm Setup' to finalize.`,
                    components: [confirmRow]
                });

                collector.stop();

                // Handle final confirmation
                const filter = m => m.customId === 'confirm_setup' && m.user.id === interaction.user.id;
                interaction.channel.awaitMessageComponent({ filter, time: 15000 })
                    .then(async conf => {
                        if (conf.customId === 'confirm_setup') {
                            let userData = await db.get(`shackData.${interaction.user.id}`) || JSON.parse(JSON.stringify(defaultShackData));
                            userData.info.userid = interaction.user.id;
                            userData.info.username = interaction.user.username;
                            userData.info.reminders = remindersEnabled;
                            userData.info.donatorRank = null; // Ensure this field is managed as needed
                            // Save the updated data
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

                            await conf.update({ content: 'Setup complete!', embeds: [embed], components: [] });
                        }
                    }).catch(console.error);
            }
        });
    }
};

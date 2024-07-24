const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Function to generate a human-readable timestamp in GMT
function formatTimestamp(timestamp) {
    const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
    return `<t:${unixTimestamp}:F>`;
}

// Function to find the closest data save entries to specific time differences
function findRecommendedSorts(latestSave, userStats) {
    const oneDayMin = 20 * 60 * 60 * 1000;
    const oneDayMax = 28 * 60 * 60 * 1000;
    const oneWeekMin = 6 * 24 * 60 * 60 * 1000;
    const oneWeekMax = 8 * 24 * 60 * 60 * 1000;
    const oneMonthMin = 28 * 24 * 60 * 60 * 1000;
    const oneMonthMax = 34 * 24 * 60 * 60 * 1000;

    let closestDay, closestWeek, closestMonth;
    let minDayDiff = Infinity, minWeekDiff = Infinity, minMonthDiff = Infinity;

    userStats.forEach(snapshot => {
        const timeDiff = Math.abs(new Date(latestSave.timestamp) - new Date(snapshot.timestamp));

        if (timeDiff >= oneDayMin && timeDiff <= oneDayMax && timeDiff < minDayDiff) {
            minDayDiff = timeDiff;
            closestDay = snapshot;
        }

        if (timeDiff >= oneWeekMin && timeDiff <= oneWeekMax && timeDiff < minWeekDiff) {
            minWeekDiff = timeDiff;
            closestWeek = snapshot;
        }

        if (timeDiff >= oneMonthMin && timeDiff <= oneMonthMax && timeDiff < minMonthDiff) {
            minMonthDiff = timeDiff;
            closestMonth = snapshot;
        }
    });

    return { closestDay, closestWeek, closestMonth };
}

// Function to generate a page embed for DataSaves
function generatePageEmbed(interaction, userStats = [], page = 0, pageSize = 10) {
    // Ensure userStats is an array
    if (!Array.isArray(userStats)) {
        userStats = [];
    }

    // Sort DataSaves by timestamp (newest first)
    userStats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalPages = Math.ceil(userStats.length / pageSize);
    const start = page * pageSize;
    const end = Math.min(start + pageSize, userStats.length);

    const pageData = userStats.slice(start, end);
    const description = pageData.length > 0
        ? pageData.map((snapshot, index) => `**ID:** ${snapshot.id} - **Timestamp:** ${formatTimestamp(snapshot.timestamp)}`).join('\n\n')
        : 'No datasaves available.';

    const embed = new EmbedBuilder()
        .setTitle(`DataSaves for ${interaction.user.username}`)
        .setDescription(description)
        .setFooter({ text: `Page ${page + 1} of ${totalPages || 1}`, iconURL: interaction.user.displayAvatarURL() })
        .setColor('#FEFFA3');

    // Add Recommended Sorts if this is the first page
    if (page === 0 && userStats.length > 0) {
        const latestSave = userStats[0];
        const { closestDay, closestWeek, closestMonth } = findRecommendedSorts(latestSave, userStats);

        let recommendedSortsDescription = '';

        if (closestDay) {
            recommendedSortsDescription += `**1. ${latestSave.id} vs ${closestDay.id}**\n`;
        }

        if (closestWeek) {
            recommendedSortsDescription += `**2. ${latestSave.id} vs ${closestWeek.id}**\n`;
        }

        if (closestMonth) {
            recommendedSortsDescription += `**3. ${latestSave.id} vs ${closestMonth.id}**\n`;
        }

        if (!recommendedSortsDescription) {
            recommendedSortsDescription = 'None';
        }

        embed.addFields({ name: 'Recommended Sorts', value: recommendedSortsDescription });
    }

    return embed;
}

// Function to create action row with pagination buttons
function createActionRow(currentPage, totalPages) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev_page')
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage >= totalPages - 1)
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('datasaves')
        .setDescription('View your saved data captures.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        console.log('Executing datasaves command');

        try {
            const userStats = await db.get(`shackData.${userId}.stats`) || [];
            console.log(`Fetched user stats for user ${userId}:`, userStats);

            if (userStats.length === 0) {
                console.log('No datasaves available for user', userId);
                await interaction.reply({ content: 'You have no datasaves available.', ephemeral: true });
                return;
            }

            const pageSize = 15;
            let currentPage = 0;
            const totalPages = Math.ceil(userStats.length / pageSize);

            const row = createActionRow(currentPage, totalPages);

            const initialMessage = await interaction.reply({
                embeds: [generatePageEmbed(interaction, userStats, currentPage, pageSize)],
                components: [row],
                ephemeral: false,
                fetchReply: true // Add this to fetch the message for further updates
            });
            console.log('Initial message sent');

            const collector = initialMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                console.log(`Button pressed: ${i.customId}`);
                if (i.customId === 'prev_page' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                    currentPage++;
                } else {
                    await i.reply({ content: 'Invalid action or page boundary reached.', ephemeral: true });
                    return;
                }

                console.log(`Current page: ${currentPage}`);
                const newRow = createActionRow(currentPage, totalPages);
                const newEmbed = generatePageEmbed(interaction, userStats, currentPage, pageSize);

                try {
                    if (i.deferred || i.replied) {
                        console.log('Editing reply');
                        await i.editReply({ embeds: [newEmbed], components: [newRow] });
                    } else {
                        console.log('Deferring update');
                        await i.deferUpdate(); // Defer the update to give time for processing
                        await initialMessage.edit({ embeds: [newEmbed], components: [newRow] });
                    }
                } catch (error) {
                    console.error('Error updating interaction:', error);
                    try {
                        await i.followUp({ content: 'An error occurred while processing your response.', ephemeral: true });
                    } catch (followUpError) {
                        console.error('Error following up interaction:', followUpError);
                    }
                }
            });

            collector.on('end', async () => {
                try {
                    await initialMessage.edit({ components: [] });
                    console.log('Collector ended, components cleared');
                } catch (error) {
                    console.error('Error clearing components after collector end:', error);
                }
            });

        } catch (error) {
            console.error('Error fetching DataSaves:', error);
            await interaction.reply({ content: 'An error occurred while fetching your DataSaves.', ephemeral: true });
        }
    }
};

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
function generatePageEmbed(userStats, page = 0, pageSize = 10, interaction) {
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
    snapshotHandler: function (client) {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'view_snapshots' || interaction.customId === 'prev_page' || interaction.customId === 'next_page') {
                const userId = interaction.user.id;
                try {
                    await interaction.deferUpdate(); // Defers the update to give us more time

                    const userStats = await db.get(`shackData.${userId}.stats`) || [];
                    console.log(`Fetched user stats for user ${userId}:`, userStats);

                    if (userStats.length === 0) {
                        await interaction.reply({ content: 'You have no DataSaves available.', ephemeral: true });
                        return;
                    }

                    const pageSize = 15;
                    let currentPage = 0;
                    const totalPages = Math.ceil(userStats.length / pageSize);

                    if (interaction.message && interaction.message.embeds && interaction.message.embeds.length > 0) {
                        const footerText = interaction.message.embeds[0].footer.text;
                        const currentPageMatch = footerText.match(/Page (\d+) of/);
                        if (currentPageMatch) {
                            currentPage = parseInt(currentPageMatch[1], 10) - 1;
                        }
                    }

                    if (interaction.customId === 'prev_page' && currentPage > 0) {
                        currentPage--;
                    } else if (interaction.customId === 'next_page' && currentPage < totalPages - 1) {
                        currentPage++;
                    }

                    const row = createActionRow(currentPage, totalPages);
                    const newEmbed = generatePageEmbed(userStats, currentPage, pageSize, interaction);

                    await interaction.editReply({
                        embeds: [newEmbed],
                        components: [row]
                    });
                } catch (error) {
                    console.error('Error updating interaction:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        try {
                            await interaction.followUp({ content: 'An error occurred while processing your response.', ephemeral: true });
                        } catch (followUpError) {
                            console.error('Error following up interaction:', followUpError);
                        }
                    }
                }
            }
        });
    }
};

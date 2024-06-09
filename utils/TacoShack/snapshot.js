const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Function to generate a human-readable timestamp in GMT
function formatTimestamp(timestamp) {
    const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
    return `<t:${unixTimestamp}:F>`;
}

// Function to generate a page embed for snapshots
function generatePageEmbed(userStats, page, pageSize) {
    // Sort snapshots by timestamp (oldest first)
    userStats.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const totalPages = Math.ceil(userStats.length / pageSize);
    const start = page * pageSize;
    const end = Math.min(start + pageSize, userStats.length);

    const pageData = userStats.slice(start, end);
    const description = pageData.length > 0
        ? pageData.map(snapshot => `**ID:** ${snapshot.id}\n**Timestamp:** ${formatTimestamp(snapshot.timestamp)}`).join('\n\n')
        : 'No snapshots available.';

    return new EmbedBuilder()
        .setTitle('Snapshots')
        .setDescription(description)
        .setFooter({ text: `Page ${page + 1} of ${totalPages || 1}` })
        .setColor('#FEFFA3');
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

            if (interaction.customId === 'view_snapshots') {
                const userId = interaction.user.id;
                try {
                    const userStats = await db.get(`shackData.${userId}.stats`) || [];

                    if (userStats.length === 0) {
                        await interaction.reply({ content: 'You have no snapshots available.', ephemeral: false });
                        return;
                    }

                    const pageSize = 15;
                    let currentPage = 0;
                    const totalPages = Math.ceil(userStats.length / pageSize);

                    const row = createActionRow(currentPage, totalPages);

                    const initialMessage = await interaction.reply({
                        embeds: [generatePageEmbed(userStats, currentPage, pageSize)],
                        components: [row],
                        ephemeral: false
                    });

                    const buttonCollector = initialMessage.createMessageComponentCollector({ time: 60000 });

                    buttonCollector.on('collect', async i => {
                        if (i.customId === 'prev_page' && currentPage > 0) {
                            currentPage--;
                        } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                            currentPage++;
                        }

                        const row = createActionRow(currentPage, totalPages);

                        await i.update({
                            embeds: [generatePageEmbed(userStats, currentPage, pageSize)],
                            components: [row]
                        });
                    });

                    buttonCollector.on('end', collected => {
                        if (collected.size === 0) {
                            initialMessage.edit({ components: [] }).catch(console.error);
                        }
                    });

                } catch (error) {
                    console.error('Error handling snapshot button:', error);
                    await interaction.reply({ content: 'An error occurred while fetching your snapshots.', ephemeral: true });
                }
            }
        });
    }
};

const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const donatorPacks = require('./donatorPacks.json');

// Mapping for shack locations
const locationMapping = {
    "🌮 Taco Shack": "taco",
    "🏬 Mall Shack": "mall",
    "⛱ Beach Shack": "beach",
    "🎢 Amusement Park Shack": "amusement",
    "🏙 City Shack": "city",
    "🏛 HQ Balance": "hq"
};

// Function to parse stats from the embed description
function parseStatsEmbed(description) {
    const stats = {};
    const lines = description.split('\n').filter(line => line.trim() !== '');

    lines.forEach(line => {
        let match;
        if (match = line.match(/👨‍🍳 \*\*Shifts Worked:\*\* ([\d,]+)/)) {
            stats.shiftsworked = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/👛 \*\*Tips Collected:\*\* ([\d,]+)/)) {
            stats.tipscollected = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/⌛ \*\*Overtime Shifts:\*\* ([\d,]+)/)) {
            stats.overtimes = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/🕓 \*\*Daily Gifts Collected:\*\* ([\d,]+)/)) {
            stats.dailygiftscollected = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/📩 \*\*Total Votes:\*\* ([\d,]+)/)) {
            stats.totalvotes = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/🗒️ \*\*Tasks Completed:\*\* ([\d,]+)/)) {
            stats.taskscompleted = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/💳 \*\*Franchise Donations:\*\* \$([\d,]+)/)) {
            stats.franchisedonations = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/🎲 \*\*Total Gambles:\*\* ([\d,]+)/)) {
            stats.totalgambles = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/💎 \*\*Gambling Winnings:\*\* \$([\d,]+)/)) {
            stats.gamblingwinnings = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/📉 \*\*Gambling Losses:\*\* \$([\d,]+)/)) {
            stats.gamblinglosses = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/🎁 \*\*Gifts Sent:\*\* ([\d,]+)/)) {
            stats.giftssent = parseInt(match[1].replace(/,/g, ''), 10);
        } else if (match = line.match(/📥 \*\*Gifts Received:\*\* ([\d,]+)/)) {
            stats.giftsreceived = parseInt(match[1].replace(/,/g, ''), 10);
        }
    });

    return stats;
}

// Function to update stats for a user
async function updateUserStats(userId, parsedStats) {
    let userStats = await db.get(`logData.${userId}.stats`) || [];

    const timestamp = new Date().toISOString();
    const uniqueId = `${userId}_${Date.now()}`;

    const snapshot = {
        id: uniqueId,
        timestamp,
        data: parsedStats
    };

    userStats.push(snapshot);

    await db.set(`logData.${userId}.stats`, userStats);
    console.log(`Stats snapshot saved for user ID ${userId}. Snapshot ID: ${uniqueId}`);

    return uniqueId; // Return the unique ID
}

// Extract shack name from title
function extractShackNameFromTitle(title) {
    return title.replace("'s Stats", "").trim();
}

module.exports = {
    setupListeners: function (client) {
        client.on('messageCreate', async message => {
            if (message.author.bot && message.author.id === '490707751832649738') {
                if (message.embeds.length > 0) {
                    const embed = message.embeds[0];

                    console.log('Embed detected, processing...');

                    // Check if the embed is related to shack stats/balances
                    if (embed.author && embed.author.name.includes('Balances')) {
                        console.log('Processing shack stats/balances embed...');

                        const guildId = message.guildId;
                        const iconUrl = embed.author.iconURL;

                        if (!iconUrl) {
                            console.error('No icon URL found in the embed author.');
                            return;
                        }

                        const embedAvatarUrl = iconUrl.replace(/\.\w+$/, '.webp');
                        console.log(`Converted embed avatar URL to .webp: ${embedAvatarUrl}`);

                        // Retrieve monitoring data from the database
                        const monitorDataList = await db.all();

                        // Iterate through all monitorData to find the matching avatar URL
                        for (const { id: key, value: monitorData } of monitorDataList) {
                            if (key.startsWith(`monitor_${guildId}_`)) {
                                const { userId, username, shackName, avatarUrl, balanceChannelId } = monitorData;

                                // Convert stored avatar URL to .webp for comparison
                                const storedAvatarUrl = avatarUrl.replace(/\.\w+$/, '.webp');
                                console.log(`Converted stored avatar URL to .webp: ${storedAvatarUrl}`);

                                if (embedAvatarUrl === storedAvatarUrl) {
                                    console.log(`Found matching embed for user ${username} (${shackName})`);

                                    const userLogData = await db.get(`logData.${userId}`) || { location: {} };

                                    // Extract balances from embed fields
                                    embed.fields.forEach(field => {
                                        const locationKey = Object.keys(locationMapping).find(key => field.name.includes(key));
                                        if (locationKey) {
                                            const balance = parseInt(field.value.replace(/[^\d]/g, ''), 10);
                                            console.log(`Updating ${locationMapping[locationKey]} balance to $${balance.toLocaleString()}`);

                                            if (locationKey === 'hq') {
                                                // If HQ Balance
                                                userLogData.hq = userLogData.hq || {};
                                                userLogData.hq.info = userLogData.hq.info || {};
                                                userLogData.hq.info.balance = balance;
                                            } else {
                                                // For other locations
                                                userLogData.location[locationMapping[locationKey]] = userLogData.location[locationMapping[locationKey]] || {};
                                                userLogData.location[locationMapping[locationKey]].info = userLogData.location[locationMapping[locationKey]].info || {};
                                                userLogData.location[locationMapping[locationKey]].info.balance = balance;
                                            }
                                        }
                                    });

                                    // Save updated data back to the database
                                    await db.set(`logData.${userId}`, userLogData);
                                    
                                    const logEmbed = new EmbedBuilder()
                                        .setTitle('Shack Balance Update')
                                        .setDescription(`Balance data updated for ${shackName}`)
                                        .addFields(embed.fields)
                                        .setColor('#FFFFF0');

                                    // Send log to the specified channel
                                    const logChannel = await client.channels.fetch(balanceChannelId);
                                    if (logChannel) {
                                        // Check if there's an existing message to update
                                        const existingMessages = await logChannel.messages.fetch({ limit: 10 });
                                        const existingEmbed = existingMessages.find(msg => msg.embeds[0]?.title === 'Shack Balance Update' && msg.embeds[0]?.description.includes(shackName));
                                        if (existingEmbed) {
                                            await existingEmbed.edit({ embeds: [logEmbed] });
                                        } else {
                                            await logChannel.send({ embeds: [logEmbed] });
                                        }
                                    }
                                }
                            }
                        }
                    } else if (embed.title && embed.title.includes("Stats") && embed.description) {
                        console.log('Processing shack stats embed...');

                        // Extract userId and shackName from the title
                        const title = embed.title;
                        const guildId = message.guildId;
                        const shackName = extractShackNameFromTitle(title);

                        // Find matching user setup data by shackName
                        const userSetupData = await db.all();
                        const userIdKey = Object.keys(userSetupData).find(key => key.startsWith(`monitor_${guildId}_`) && userSetupData[key].value.shackName === shackName);

                        if (!userIdKey) {
                            console.log(`User with shackName ${shackName} not found in the database.`);
                            return;
                        }

                        const userId = userIdKey.split('_')[2]; // Extract user ID from key
                        const monitorData = userSetupData[userIdKey].value;
                        const { statsChannelId } = monitorData;

                        const parsedStats = parseStatsEmbed(embed.description);
                        await updateUserStats(userId, parsedStats);

                        const statsEmbed = new EmbedBuilder()
                            .setTitle('Shack Stats Update')
                            .setDescription(`Stats updated for ${shackName}`)
                            .addFields(embed.fields)
                            .setColor('#FFFFF0');

                        // Send stats to the specified channel
                        const statsChannel = await client.channels.fetch(statsChannelId);
                        if (statsChannel) {
                            // Check if there's an existing message to update
                            const existingMessages = await statsChannel.messages.fetch({ limit: 10 });
                            const existingEmbed = existingMessages.find(msg => msg.embeds[0]?.title === 'Shack Stats Update' && msg.embeds[0]?.description.includes(shackName));
                            if (existingEmbed) {
                                await existingEmbed.edit({ embeds: [statsEmbed] });
                            } else {
                                await statsChannel.send({ embeds: [statsEmbed] });
                            }
                        }
                    }
                }
            }
        });
    }
};

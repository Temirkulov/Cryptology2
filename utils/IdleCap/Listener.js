const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Helper function to calculate the optimal multipliers
function calculateWithCaps(upgrades, availablePoints) {
    let totalMultiplier = 1.0; // Starting base multiplier
    let businessCap = 1000.95; // Initial business cap
    let capCost = 1000000; // Cost for a business cap
    let capsPurchased = 0; // Track number of business caps purchased
    let points = availablePoints;

    // Enhance upgrades with purchase tracking and reset cost to initial cost
    upgrades.forEach(upgrade => {
        upgrade.purchased = 0;
        upgrade.currentCost = upgrade.cost;
    });

    while (points > 0) {
        let upgradeMade = false;

        // Attempt to purchase upgrades if it does not cause totalMultiplier to exceed businessCap
        // or if we can afford a business cap immediately after
        upgrades.sort((a, b) => (b.multiplier / b.currentCost) - (a.multiplier / a.currentCost));

        for (const upgrade of upgrades) {
            const canAffordCap = (totalMultiplier + upgrade.multiplier > businessCap) && (points - upgrade.currentCost >= capCost);
            const withinCap = totalMultiplier + upgrade.multiplier <= businessCap;
            if (points >= upgrade.currentCost && (withinCap || canAffordCap)) {
                totalMultiplier += upgrade.multiplier;
                points -= upgrade.currentCost;
                upgrade.purchased++;
                upgrade.currentCost += upgrade.cost; // Increase cost for next purchase
                upgradeMade = true;
                if (canAffordCap) {
                    // Buy a business cap if we're going to exceed the business cap with this upgrade
                    businessCap += 500; // Increase business cap
                    points -= capCost; // Deduct cost of cap from available points
                    capCost *= 2.5; // Increase cost for next cap
                    capsPurchased++;
                }
                break; // Break to reassess which upgrade to purchase next
            }
        }

        if (!upgradeMade) break; // No upgrades made, exit loop
    }

    // Prepare the output for each upgrade purchased
    const purchases = upgrades.filter(u => u.purchased > 0)
                              .sort((a, b) => a.multiplier - b.multiplier) // Sort by multiplier in ascending for clarity
                              .map(u => `**${u.name}:** \`${u.purchased}\``);

    // Prepare the commands in the specified order
    const upgradeCommands = [
        ...upgrades.filter(u => u.name === "5% Multiplier").map(u => `/buy multiplier multiplier:${u.name} quantity:${u.purchased}`),
        ...upgrades.filter(u => u.name === "15% Multiplier").map(u => `/buy multiplier multiplier:${u.name} quantity:${u.purchased}`),
        ...upgrades.filter(u => u.name === "30% Multiplier").map(u => `/buy multiplier multiplier:${u.name} quantity:${u.purchased}`),
        ...upgrades.filter(u => u.name === "50% Multiplier").map(u => `/buy multiplier multiplier:${u.name} quantity:${u.purchased}`),
        ...upgrades.filter(u => u.name === "100% Multiplier").map(u => `/buy multiplier multiplier:${u.name} quantity:${u.purchased}`)
    ];

    return {
        purchases,
        businessCapsPurchased: capsPurchased,
        finalTotalMultiplier: totalMultiplier.toFixed(2),
        remainingPoints: points.toFixed(2),
        upgradeCommands
    };
}

const upgrades = [
    { name: "5% Multiplier", cost: 10, multiplier: 0.05, initialCost: 10 },
    { name: "15% Multiplier", cost: 50, multiplier: 0.15, initialCost: 50 },
    { name: "30% Multiplier", cost: 250, multiplier: 0.3, initialCost: 250 },
    { name: "50% Multiplier", cost: 750, multiplier: 0.5, initialCost: 750 },
    { name: "100% Multiplier", cost: 2500, multiplier: 1.0, initialCost: 2500 },
];


module.exports = {
    // handleIdleCapMessageCreate: function (client) {
    //     client.on('messageCreate', message => {
    //         if (message.author.bot && message.author.id === '512079641981353995') {
    //             setTimeout(() => {
    //                 console.log("Checking message after delay:", message.content); // Log message content for debugging
    //                 if (message.embeds.length > 0) {
    //                     const embed = message.embeds[0];
    //                     console.log("Found embed:", embed); // Log the entire embed for debugging
    //                     embed.fields.forEach((field, index) => {
    //                         console.log(`Field ${index + 1}: Name: ${field.name}, Value: ${field.value}`)});            
        
    //                     if (embed.title ) {
    //                         // The embed has an author name or title, reply with it
    //                         // message.reply({ content: embed.title });
    //                         console.log({ content: embed.title });
    //                     } else {
    //                         // The embed does not have an author name
    //                         console.log({ content: "No author name" });
    //                     }
    //                 } else {
    //                     console.log("No embeds found in this message.");
    //                 }
    //             }, 3000); // Delay of 3000 milliseconds (3 seconds)
    //         }
    //     });
    // },

    handleIdleCapMessageUpdate: function (client) {
        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.author.bot && newMessage.author.id === '512079641981353995') {
                // Check if there's at least one embed in the updated message
                if (newMessage.embeds.length > 0) {
                    const updatedEmbed = newMessage.embeds[0];
                    const title = updatedEmbed.title || '';
                    const author = updatedEmbed.author ? updatedEmbed.author.name : '';
                    const description = updatedEmbed.description || '';

                    console.log(`Updated Embed: ${title || author || 'No Title or Author'}`);

                    let prestigePoints = null;

                    // Check for "Prestige Point Calculator" embed
                    if (title.includes('Prestige Point Calculator')) {
                        const prestigePointsMatch = description.match(/Multipliers you could buy with `([\d,]+)` prestige points/);
                        if (prestigePointsMatch) {
                            prestigePoints = prestigePointsMatch[1].replace(/,/g, '');
                            console.log(`Extracted Prestige Points: ${prestigePoints}`);
                        }
                    }

                    // Check for "Prestige" embed
                    if (author.includes('Prestige |')) {
                        const prestigePointsMatch = description.match(/💠 \*\*Potential Prestige Points:\*\* ([\d,]+)/);
                        if (prestigePointsMatch) {
                            prestigePoints = prestigePointsMatch[1].replace(/,/g, '');
                            console.log(`Extracted Potential Prestige Points: ${prestigePoints}`);
                        }
                    }

                    if (prestigePoints) {
                        // React to the message
                        await newMessage.react('⭐'); // Use an appropriate emoji
                        console.log('Reacted to the message with the prestige points.');

                        // Listen for reaction
                        const filter = (reaction, user) => {
                            return reaction.emoji.name === '⭐' && !user.bot;
                        };

                        const collector = newMessage.createReactionCollector({ filter, time: 60000 });

                        collector.on('collect', async (reaction, user) => {
                            const availablePoints = parseInt(prestigePoints);
                            const result = calculateWithCaps(upgrades, availablePoints);

                            let description = `**Total Points:** \`${availablePoints.toLocaleString('en-US')}\`\n`;
                            description += ("Selected Upgrades:\n", result.purchases.join("\n"));
                            description += (`\n\n**🧢 Multiplier Caps:** ${result.businessCapsPurchased}`);
                            description += (`\n**📈 Final Total Multiplier:** ${result.finalTotalMultiplier}x`);
                            description += (`\n**💠 Remaining Points:** ${result.remainingPoints.toLocaleString('en-US')}`);

                            const responseEmbed = new EmbedBuilder()
                                .setTitle("📝 Prestige Multiplier Calculator")
                                .setColor('#FF7F7F')
                                .setDescription(description)
                                .setTimestamp()
                                .setFooter({ text: `${user.username}`, iconURL: user.displayAvatarURL() });

                            // Create a button
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('send_commands')
                                        .setLabel('Send Commands')
                                        .setStyle(ButtonStyle.Primary)
                                );

                            await newMessage.channel.send({ embeds: [responseEmbed], components: [row] });

                            collector.stop();
                        });

                        collector.on('end', collected => {
                            console.log(`Collected ${collected.size} reactions.`);
                        });
                    }
                }
            }
        });

        // Handle button interactions
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'send_commands') {
                const message = interaction.message;
                const embed = message.embeds[0];
                const description = embed.description;

                // Extract total points from the embed description
                const totalPointsMatch = description.match(/\*\*Total Points:\*\*\s+\`([\d,]+)\`/);
                if (totalPointsMatch) {
                    const totalPoints = parseInt(totalPointsMatch[1].replace(/,/g, ''));
                    const result = calculateWithCaps(upgrades, totalPoints);

                    await interaction.deferReply();

                    let commandsMessage = `/buy cap type:multiplier amount:${result.businessCapsPurchased}\n`;
                    commandsMessage += result.upgradeCommands.join('\n');
                    commandsMessage += `\n\n**📈 Final Total Multiplier:** ${result.finalTotalMultiplier}x`;

                    await interaction.followUp(commandsMessage);
                }
            }
        });
    }
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRow} = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const ms = require('ms'); // npm install ms -- a small utility to parse various time formats to milliseconds
const { activeReminders, setReminder, clearReminderFromDB, listActiveReminders } = require('./reminderManager'); // Adjust path as necessary

const {
    // setActiveLocation,
    getNewShackDataInstance,
    // updateShackData,
    // parseEmbedDescription,
    // categorizeLocation,
    // categorizeEmbed
} = require('./dataUtilities');
const { defaultShackData } = require('./shackDataStructure');


function categorizeLocation(locationString) {
    const keywordToLocation = {
        "🏙 City Shack": "city",
        "🎢 Amusement Park Shack": "amusement",
        "🌮 Taco Shack": "taco",
        "🏬 Mall Shack": "mall",
        "⛱ Beach Shack": "beach",
    };

    // Attempt to match location string to one of the keywords
    for (const [keyword, location] of Object.entries(keywordToLocation)) {
        if (locationString.includes(keyword)) {
            return location;
        }
    }
};

function parseEmbedDescription(description) {
    const parsedData = {};
    // Splits the description into sections for each upgrade
    const sections = description.split('\n\n').filter(section => section.trim() !== '');

    // forEach is a function that iterates over each element in an array
    sections.forEach(section => {
        // Variables to hold current section's progress and ID
        let currentProgress = null;
        let currentID = null;

        // Split the section by newline and iterate over each line
        const lines = section.split('\n');
        lines.forEach(line => {
            // Look for progress and ID in the line
            const progressMatch = line.match(/\((\d+)\/\d+\)/);
            const idMatch = line.match(/ID: `(.+?)`/);

            if (progressMatch) {
                currentProgress = parseInt(progressMatch[1], 10);
            } else if (idMatch) {
                currentID = idMatch[1];
            }
        });

        // If both ID and progress were found in the section, assign them to parsedData
        if (currentID && currentProgress !== null) {
            parsedData[currentID] = currentProgress;
        }
    });

    return parsedData;
}
async function updateShackData(shackData, category, parsedData, userId) {
    const activeLocation = shackData.info.activeLocation;
    // Ensuring that the location and category exist in shackData
    if (!shackData.location[activeLocation] || !shackData.location[activeLocation][category]) {
        console.error(`Location '${activeLocation}' or category '${category}' not found.`);
        return;
    }

    const locationCategoryData = shackData.location[activeLocation][category];
    Object.entries(parsedData).forEach(([key, value]) => {
        // Check if the current key exists in the category data
        if (key in locationCategoryData) {
            console.log(`Before Update - Key: '${key}', Current Value: ${locationCategoryData[key]}, New Value: ${value}`);
            locationCategoryData[key] = value;
            console.log(`After Update - Key: '${key}', Updated Value: ${locationCategoryData[key]}`);
        } else {
            // If the key is not found, it could indicate a need for dynamic addition or a mistake
            console.warn(`Key '${key}' not found in '${activeLocation}' ${category}.`);
            // Optionally add the key dynamically if that's the intended behavior
            // locationCategoryData[key] = value;
        }
    });

    // Finally, save the updated data back to the database
    await db.set(`shackData.${userId}`, shackData);
    console.log(`Data for '${category}' updated for user ${userId} at location '${activeLocation}'.`);
}

async function checkUserData(userId) {
    // Fetch the user's shack data from the database
    const shackData = await db.get(`shackData.${userId}`);

    if (shackData) {
        console.log(`Shack data for user ID ${userId}:`);
        console.log(JSON.stringify(shackData, null, 2)); // Pretty print the object for readability
    } else {
        console.log(`No shack data found for user ID ${userId}.`);
    }
}

function categorizeEmbed(embedTitle) {
    if (embedTitle.includes("Hotdog Cart")) return "cart";
    if (embedTitle.includes("Taco Truck")) return "truck";
    if (embedTitle.includes("Mall Kiosk")) return "kiosk";
    if (embedTitle.includes("Ice Cream Stand")) return "stand";
    if (embedTitle.includes("Upgrades")) return "upgrades";
    if (embedTitle.includes("Employees")) return "hire";
    if (embedTitle.includes("Decorations")) return "decorations";
    if (embedTitle.includes("Advertisements")) return "advertisements";
    if (embedTitle.includes("Amusement Park Attractions")) return "attractions";

    // Add more conditions as necessary
    return "unknown"; // Default category
}
function parseHQEmbed(description) {
    const parsedData = { upgrades: {}, hire: {} };

    // Split the description into lines for individual processing.
    const lines = description.split('\n').filter(line => line.trim() !== '');

    // Variables to hold the current section's name key and progress.
    let nameKey = "";
    let currentProgress = null;

    lines.forEach(line => {
        // Resetting progress for each new line to ensure it matches with the current name.
        currentProgress = null;

        // Extracting the current level and name from the line.
        const progressMatch = line.match(/\((\d+)\/\d+\)/);
        const nameMatch = line.match(/^\*\*(.+?)\*\*/);

        if (nameMatch && progressMatch) {
            // If both name and progress are found in the same line, process them together.
            nameKey = nameMatch[1].toLowerCase().replace(/\s+/g, '');
            currentProgress = parseInt(progressMatch[1], 10);
            console.log(`Name: ${nameKey}, Progress: ${currentProgress}`);
            // Determining the category based on existing keys in the default structure.
            if (nameKey in defaultShackData.hq.upgrades) {
                parsedData.upgrades[nameKey] = currentProgress;
            } else if (nameKey in defaultShackData.hq.hire) {
                parsedData.hire[nameKey] = currentProgress;
            }
        }
    });

    return parsedData;
}
async function updateHQData(shackData, parsedHQData, userId) {
    Object.entries(parsedHQData.upgrades).forEach(([key, value]) => {
        shackData.hq.upgrades[key] = value;
    });

    Object.entries(parsedHQData.hire).forEach(([key, value]) => {
        shackData.hq.hire[key] = value;
    });
    // Ensure you're setting the entire shackData object and not just the hq part
    await db.set(`shackData.${userId}`, shackData);
    console.log(`HQ data updated and saved for user ${userId}.`);
}

async function updateHQInfoFromEmbed(userId, embedFields) {
    let parsedData = {
        balance: 0,
        income: 0,
        tip: 0,
        work: 0,
        overtime: 0,
        lunchRush: 0,
        taskMultiplier: 0,
        totalTacosSold: 0
    };

    for (const field of embedFields) {
        switch (field.name) {
            case 'Balance':
                parsedData.balance = parseInt(field.value.replace(/[^\d]/g, ''), 10);
                break;
            case 'Bonuses':
                const bonuses = field.value.split('\n');
                for (const bonus of bonuses) {
                    if (bonus.includes('Income:')) {
                        parsedData.income = parseInt(bonus.replace(/,+/g, '').match(/\+\$(\d+)/)[1], 10);
                        console.log(parsedData.income);
                    } else if (bonus.includes('Tip:')) {
                        parsedData.tip = parseFloat(bonus.match(/\+(\d+)%/)[1]) / 100;
                        console.log(parsedData.tip);
                    } else if (bonus.includes('Work:')) {
                        parsedData.work = parseFloat(bonus.match(/\+(\d+)%/)[1]) / 100;
                        console.log(parsedData.work);
                    } else if (bonus.includes('Overtime:')) {
                        parsedData.overtime = parseFloat(bonus.match(/(\d+)x Money/)[1]);
                    } else if (bonus.includes('Lunch Rush:')) {
                        parsedData.lunchRush = parseInt(bonus.match(/\+(\d+) Hours/)[1], 10);
                    } else if (bonus.includes('Task Multiplier:')) {
                        parsedData.taskMultiplier = parseFloat(bonus.match(/(\d+)x Task Rewards/)[1]);
                    }
                }
                break;
            case 'Total Tacos Sold':
                parsedData.totalTacosSold = parseInt(field.value.replace(/[^\d]/g, ''), 10);
                break;
        }
    }
    if (Object.keys(parsedData).length > 0) {
    await db.set(`shackData.${userId}.hq.info`, parsedData);
    console.log(`HQ information updated for user ${userId}`);
    } else {
        console.log(`Attempted to save empty userData for ${user.id}, operation skipped.`);
    }
}


// async function setReminder(client, userId, field, message) {
//     const userData = await db.get(`shackData.${userId}`);
//     if (!userData || !userData.reminders) {
//         console.log(`No data found for user ${userId}, or reminders are disabled.`);
//         return; // Stop if no user data or reminders disabled
//     }

//     // Calculate the delay in milliseconds from the value
//     const delayMilliseconds = parseCooldown(field.value);

//     console.log(`Setting a reminder for ${userId} - ${field.name}: Delay set for ${delayMilliseconds}ms`);
//     setTimeout(async () => {
//         try {
//             console.log(`Reminder triggered for ${userId} - ${field.name}`);
//             await message.reply({
//                 content: `<@${userId}> Your cooldown for ${field.name} is now ready!`,
//                 ephemeral: true // Change this to false if you want the reply to be visible to everyone
//             });
//         } catch (error) {
//             console.error('Error sending reminder:', error);
//         }
//     }, delayMilliseconds);
// }

function parseCooldown(value) {
    const regex = /(\d+)\s*(seconds|minutes|hours)/;
    const matches = value.match(regex);
    if (!matches) return 0;

    let time = parseInt(matches[1], 10);
    switch (matches[2]) {
        case 'second':
        case 'seconds':
            return time * 1000;
        case 'minute':
        case 'minutes':
            return time * 60000;
        case 'hour':
        case 'hours':
            return time * 3600000;
        default:
            return 0;
    }
}

function extractUsernameFromFooter(footerText) {
    let usernamePart;
    if (footerText.includes("Use '/menu view' to view the items you are cooking!")) {
        // Extract the part after the specific text, assuming it's structured as instructional text followed by username and location
        usernamePart = footerText.split("\n")[1]; // The username and location are after the newline
    } else if (footerText.includes("🏁 Complete all your tasks to earn rewards!")) {
        usernamePart = footerText.split("\n")[1]; // The username and location are after the newline
    } else if (footerText.includes("Your Total Streak:")) {
            usernamePart = footerText.split("\n").pop(); // The username and location are at the end after all newlines
    } else {
        // Handle the regular footer format which is just username and location
        usernamePart = footerText;
    }
    // Assume the username and location are separated by ' | ', extract the first part as the username
    return usernamePart.split(' | ')[0].trim();
}
async function askToEnableReminders(message, userData) {
    const enableRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('enable_reminders')
                .setLabel('Enable Reminders')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('disable_reminders')
                .setLabel('No Thanks')
                .setStyle(ButtonStyle.Danger)
        );

    const askEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Enable Timer Reminders?')
        .setDescription('Do you want to enable reminders for TacoShack cooldowns? Your current Donator Rank is ' + (userData.info.donatorRank || 'None'));

    // Send the message to the channel from which the original reaction came
    await message.channel.send({ embeds: [askEmbed], components: [enableRow] });

    // Optionally, you might handle the response immediately here, or you can handle it in the main interaction listener
}



module.exports = {
    handleTacoShackMessageCreate: function (client) {
        const enable_reminders = require('./timerReaction.js');
        // Call the exported functions from each module
        enable_reminders.timerReactionHandler(client);

        client.on('messageCreate', async message => {
            if (message.author.bot && message.author.id === '490707751832649738') {
                setTimeout(async () => {
                    if (message.embeds.length > 0) {
                        const embed = message.embeds[0];
                        console.log(embed);
                        console.log("Found embed:", embed);
                        const reminderManager = require('./reminderManager'); // Import centralized reminder manager

                        if (embed.title && embed.title.includes("Cooldowns")) {
                            await message.react('⏰');
                            const username = extractUsernameFromFooter(embed.footer.text);  // Ensure this function is robust to handle various footer formats
                            const userSetupData = await db.get(`shackData`) || {};                        
                            const userIds = Object.keys(userSetupData);
                            const matchedUserId = userIds.find(id => userSetupData[id].info && userSetupData[id].info.username === username);
                            if (!matchedUserId) {
                                await message.react('⚠️');
                                console.log(`User ${username} not found in the database.`);
                                return;
                            }                
                            const userData = await db.get(`shackData.${matchedUserId}`) || {};                        
                            const filter = (reaction, user) => reaction.emoji.name === '⏰' && !user.bot;
                            const collector = message.createReactionCollector({ filter, time: 20000, maxUsers: 1 });
            
                            collector.on('collect', async (reaction, user) => {
                                const cooldownData = {
                                    userId: user.id,
                                    fields: embed.fields.map(field => ({ name: field.name, value: field.value })),
                                    timestamp: new Date().getTime()
                                };
                                console.log(`Cooldown data collected for user ${user.username}:`, cooldownData);
                                await db.set(`cooldownEmbed_${user.id}`, cooldownData);
            
                                if (userData.reminders) {
                                    const remindersResult = await listActiveReminders(user.id, reaction.message, client);
                                    if (!reaction.message.acknowledged) { // Check if the interaction has not been previously acknowledged
                                        await reaction.message.reply({ ...remindersResult, ephemeral: true }).catch(console.error);
                                    }
                                        } else {
                                    await askToEnableReminders(reaction.message, userData);
                                }
                                });
            
                            collector.on('end', collected => {
                                if (collected.size === 0) console.log("No reactions collected.");
                            });
                            if (userData.reminders) {
                                const cooldownData = {
                                    userId: matchedUserId,
                                    fields: embed.fields.map(field => ({ name: field.name, value: field.value })),
                                    timestamp: new Date().getTime()
                                };
                                console.log(`Processing autonomous reminders for ${matchedUserId}`);
                                reminderManager.processReminders(message, matchedUserId, cooldownData);
                            }
                    
                            } else if (embed.description && embed.footer && embed.footer.text) {
                                const username = extractUsernameFromFooter(embed.footer.text);
                                const userSetupData = await db.get(`shackData`) || {};
                                const userIds = Object.keys(userSetupData);
                                const matchedUserId = userIds.find(id => userSetupData[id].info && userSetupData[id].info.username === username);
                
                                if (!matchedUserId) {
                                    await message.react('⚠️');
                                    console.log(`User ${username} not found in the database.`);
                                    return;
                                }
                
                                const userData = await db.get(`shackData.${matchedUserId}`);
                                if (!userData || userData.info.reminders === 'Disabled') {
                                    console.log(`Reminders are disabled for ${username}.`);
                                    return;
                                }
                
                                const serverPatreonSettings = await db.get(`patreonPerks_${message.guild.id}`) || {};
                                const donatorPacks = require('./donatorPacks.json');
                                const donatorRank = userData.info.donatorRank || 'None';
                                const donatorSettings = donatorPacks[donatorRank];
                
                                // Calculate effective cooldowns
                                const effectiveWorkCooldown = Math.max(0, donatorSettings.workCooldown - (serverPatreonSettings.workCooldown || 0)) * 1000; // milliseconds
                                const effectiveTipCooldown = Math.max(0, donatorSettings.tipCooldown - (serverPatreonSettings.tipCooldown || 0)) * 1000; // milliseconds
                                const overtimeCooldown = 30 * 60 * 1000; // 30 minutes in milliseconds
                
                                console.log(`Settings for guild ${message.guild.id}:`, JSON.stringify(serverPatreonSettings));
                
                                if (embed.description.includes("in tips!")) {
                                    setReminder(matchedUserId, 'Tips', effectiveTipCooldown, () => {
                                        message.channel.send(`<@${matchedUserId}> Your </tips:1203826208383696957> cooldown is now ready!`);
                                    });
                                } else if (embed.footer.text.includes("Use '/menu view' to view the items you are cooking!")) {
                                    setReminder(matchedUserId, 'Work', effectiveWorkCooldown, () => {
                                        message.channel.send(`<@${matchedUserId}> Your </work:1203826210250166292> cooldown is now ready!`);
                                    });
                                } else if (embed.description.includes("while working overtime!")) {
                                    setReminder(matchedUserId, 'Overtime', overtimeCooldown, () => {
                                        message.channel.send(`<@${matchedUserId}> Your </overtime:1203826204356911104> cooldown is now ready!`);
                                    });
                                }
                            } else {
                                console.log("Message does not include 'Cooldowns' in the title.");
                            }
                    } else {
                        console.log("No embeds found in this message.");
                    }
                }, 1500); // Delay to prevent API spam
            }
        });
    },
    handleTacoShackMessageUpdate: function (client) {
        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.author.bot && newMessage.author.id === '490707751832649738') {
                if (newMessage.embeds.length > 0) {
                    const updatedEmbed = newMessage.embeds[0];
                    const validTitles = ["Upgrades", "Employees", "Decorations", "Advertisements", "Taco Truck Upgrades", "Mall Kiosk Upgrades", "Ice Cream Stand Upgrades", "Amusement Park Attractions", "Hotdog Cart Upgrades"];
                    const firstField = updatedEmbed.fields[0];
                    console.log(updatedEmbed.fields);
                    if (validTitles.some(title => updatedEmbed.title && updatedEmbed.title.includes(title))) {
                        // console.log("Embed title does not match the required criteria.");
                        // return; // Exit if none of the keywords are found in the title
                    // }
                
                    
                    // Check if footer exists and split username and location from the footer text
                    if (updatedEmbed.footer && updatedEmbed.footer.text) {
                        const footerParts = updatedEmbed.footer.text.split('|');
                        const username = footerParts[0].trim();
                        const locationString = footerParts.length > 1 ? footerParts[1].trim() : '';
                        const activeLocation = categorizeLocation(locationString);
                        const category = categorizeEmbed(updatedEmbed.title);
                        
                        // Retrieve all user data and find the user ID based on the username
                        const userSetupData = await db.get(`shackData`) || {};
                        const userIds = Object.keys(userSetupData);
                        const matchedUserId = userIds.find(id => 
                            userSetupData[id].info && 
                            userSetupData[id].info.username === username
                        );
                        
                        let shackData = await db.get(`shackData.${matchedUserId}`) || getNewShackDataInstance();
                        shackData.info.activeLocation = activeLocation; // Explicitly set the active location here
                        // await db.set(`shackData.${matchedUserId}.info.activeLocation`, activeLocation);
                        const parsedData = parseEmbedDescription(updatedEmbed.description, matchedUserId);
                        console.log(parseEmbedDescription(updatedEmbed.description, matchedUserId));
                        console.log(`Processing update for user: ${username} in location: ${activeLocation} for category: ${category}`);

                        if (!matchedUserId) {
                            await newMessage.react('⚠️');
                            console.log(`User ${username} not found in the database.`);
                            return;
                        } 
                            // Implement similar logic for 'hire', 'decorations', 'advertisements', etc., based on 'category'
                            const title = newMessage.embeds[0].title || '';
                            const categoryhq = title.includes('Employees') ? 'employees' : 'upgrades';

                            if (title.includes('Employees') || title.includes('Upgrades')) {
                                const parsedHQdata = parseHQEmbed(updatedEmbed.description);
                                await updateHQData(shackData, parsedHQdata, matchedUserId);
                                console.log("Parsed HQ Data:", JSON.stringify(parsedHQdata, null, 2));
                            }
                                //     // Ensure you have the correct user ID to update. This example uses a placeholder function to fetch the user ID.
                            //     const userId = matchedUserId;
                            //     if (!userId) {
                            //         console.log("User ID not found from embed.");
                            //         return;
                            //     }
                            //     const parsedHQData = parseHQEmbed(updatedEmbed.description);

                            //     await updateHQData(shackData, parsedHQData, userId);
                            // }
                            
                        // await updateHQData(shackData, parsedHQData, matchedUserId);

                        updateShackData(shackData, category, parsedData, matchedUserId);

                        console.log(`Data updated for user ${username} at location ${activeLocation}.`);
                        checkUserData(matchedUserId).catch(console.error);

                    } else {
                        console.log("No footer found in the embed.");
                    }
                } else if (firstField && (firstField.name.includes("Balance") && !updatedEmbed.title.includes("Shack Headquarters"))) {
                    const footerParts = updatedEmbed.footer.text.split('|');
                    const username = footerParts[0].trim();
                    const userSetupData = await db.get(`shackData`) || {};
                    const userIds = Object.keys(userSetupData);
                    const matchedUserId = userIds.find(id => 
                        userSetupData[id].info && 
                        userSetupData[id].info.username === username
                    );
                
                    // Check if a matched user ID was found
                    if (matchedUserId) {
                        // Assuming 'updatedEmbed.fields' contains the fields from the embed you want to process
                        await updateHQInfoFromEmbed(matchedUserId, updatedEmbed.fields);
                        console.log(`HQ information updated for user ID: ${matchedUserId}`);
                    } else {
                        console.log(`No matching user found for username: ${username}`);
                    }
                }                

                }
            }
        });
    }
            


};

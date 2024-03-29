const { Embed } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const {
    // categorizeLocation,
    categorizeEmbed,
    parseEmbedDescription,
    getNewShackDataInstance,
    setActiveLocation,
    updateShackData
} = require('./dataUtilities'); // Adjust the path as necessary

function categorizeLocation(locationString) {
    const keywordToLocation = {
        "City Shack": "city",
        "Amusement Park Shack": "amusement",
        "Taco Shack": "taco",
        "Mall Shack": "mall",
        "Beach Shack": "beach",
    };

    // Attempt to match location string to one of the keywords
    for (const [keyword, location] of Object.entries(keywordToLocation)) {
        if (locationString.includes(keyword)) {
            return location;
        }
    }

    // Return a default or error identifier if no match is found
    return "Unknown Location";
}

module.exports = {
    handleTacoShackReactionAdd: async function (client) {
        const profile = require('./Profile.js');
        const analysis = require('./Analysis.js');
        // Call the exported functions from each module
        profile.profileHandler(client);
        analysis.analysisHandler(client);

        
        client.on('messageCreate', async message => {
            if (message.author.bot && message.author.id === '490707751832649738') {
                await delay(2000);
                // console.log("Reacting to TacoShack bot message...");
                if (message.embeds.length > 0) {
                    const validTitles = ["Upgrades", "Employees", "Decorations"];
                    const TitleEmbed = message.embeds[0];
                    const firstField = message.embeds[0].fields[0];
                    if (firstField && (firstField.name.includes("Shack Name") || firstField.value.includes("Shack Name"))) {

                try {
                    await message.react('📋');
                    console.log("Awaiting reactions to TacoShack bot message...");
                    
                    // Define reaction filter specific to TacoShack
                    const filter = (reaction, user) => reaction.emoji.name === '📋' && !user.bot;
                    const collected = await message.awaitReactions({ filter, max: 1, time: 10000 });
                    const reaction = collected.first();

                    if (reaction) {
                        const user = reaction.users.cache.filter(u => !u.bot).first();
                        const embed = message.embeds[0];
                        console.log(embed)
                        const fields = embed.fields;
                        let extractedShackName = "";
                        if (embed.fields.length > 0 && embed.fields[0].name === "Shack Name") {
                            const parts = embed.fields[0].value.split(' '); // Split the value by spaces
                            for (let part of parts) {
                                if (part.includes('(')) break; // Stop if part includes a parenthesis
                                if (extractedShackName.length > 0) extractedShackName += " "; // Add space between parts
                                extractedShackName += part;
                            }
                            extractedShackName = extractedShackName.trim(); // Set the extracted shack name
                        }
                        console.log("Extracted Shack Name:", extractedShackName);
                        const userSetupData = await db.get('shackData') || {};
                        const userIds = Object.keys(userSetupData);
                        const matchedUserId = userIds.find(id => 
                            userSetupData[id].info && 
                            userSetupData[id].info.shackName === extractedShackName
                        );
                        console.log("Matched User ID:", matchedUserId);
                        
                        if (!matchedUserId) {
                            await newMessage.react('⚠️');
                            console.log(`User ${username} not found in the database.`);
                            return;
                        } 
                        let shackData = await db.get(`shackData.${matchedUserId}`) || {};
                        if (!shackData) {
                            // Assuming defaultShackData is the default structure imported from shackDataStructure.js
                            shackData = JSON.parse(JSON.stringify(defaultShackData)); // Deep clone to avoid mutating the original
                        }
    
                        // console.log(JSON.stringify(shackData, null, 2)); // Before setting properties

                        fields.forEach(field => {    
                                                                        
                            switch (field.name) {
                                case 'Shack Name':
                                    const parts2 = field.value.split(' '); // Split the value by spaces
                                    let shackName = "";
                                    for (let part of parts2) {
                                        if (part.includes('(')) break; // Stop if the part includes a parenthesis
                                        if (shackName.length > 0) shackName += " "; // Add a space between parts
                                        shackName += part;
                                    }
                                    shackData.info.shackName = shackName.trim(); // Set the extracted shack name
                                    break;
                                case 'Franchise':
                                case 'Franchise | Recruiter':
                                case 'Franchise | Co-Owner':
                                case 'Franchise | Owner':
                                    // Handling franchise status based on field value
                                    const parts = field.value.split('|').map(part => part.trim());
                                    shackData.info.franchise = parts[0];
                                    shackData.info.franchiseStatus = parts.length > 1 ? parts[1] : 'employee';
                                    break;
                                case 'Location':
                                    // Example of categorizing location based on field value
                                    const locationValue = field.value; // The actual string value of the location field
                                    console.log(locationValue)
                                    // Assuming locationValue contains the name of the location, directly set it
                                    // This approach assumes the locationValue is directly usable, adjust as needed
                                    shackData.info.activeLocation = categorizeLocation(locationValue);
                                    break;
                                case 'Income (per hour)':
                                    const activeLocation1 = shackData.info.activeLocation;
                                    // Split the value to separate income and tacos per hour
                                    const incomeParts = field.value.split('|').map(part => part.trim());
                                    // Use regex to find matches for base income and boosts within brackets
                                    const incomeMatch = incomeParts[0].match(/\$(\d+(?:,\d+)*)(?: \(\+\$\d+(?:,\d+)*\/hr\))?/);
                                    // This regex looks for a dollar amount optionally followed by a boost amount in brackets
                                    if (incomeMatch) {
                                        const baseIncome = incomeMatch[1].replace(/,/g, ''); // Removes commas for conversion to number
                                        // Assuming you want to store the income as a number
                                        const locationKey = activeLocation1.toLowerCase(); // Ensure this matches your object keys accurately
                                        if (shackData[locationKey] && shackData[locationKey].info) {
                                            shackData[locationKey].info.income = Number(baseIncome);
                                        } else {
                                            console.warn(`Active location '${activeLocation1}' not found or missing info structure.`);
                                        }
                                    }
                                
                                    // Handle tacos per hour part similarly if needed
                                    break;
                                case 'Balance':
                                    const balance = field.value.split('$')[1].replace(/,/g, '');
                                    const activeLocation = shackData.info.activeLocation;
                                
                                    // Ensure the location is valid and info structure exists
                                    if (shackData[activeLocation] && shackData[activeLocation].info) {
                                        shackData[activeLocation].info.balance = balance;
                                    } else {
                                        console.log(`Invalid location '${activeLocation}' or missing info structure.`);
                                    }
                                    break;
                                case 'Tacos Sold':
                                    // shackData.location.info.tacosSold = field.value.split(' ')[1].replace(/,/g, '');
                                    break;
                                case 'Shack Age':
                                    // shackData.location.info.shackAge = parseInt(field.value.split(' ')[1]);
                                    break;
                                case 'Level':
                                    // shackData.info.level = parseInt(field.value.split(' ')[2]);
                                    break;
                                // Add more cases as needed
                            }

                        });
                        console.log(JSON.stringify(shackData, null, 2)); // After setting properties

                        // After processing all fields, save userData under a single key
                        if (Object.keys(shackData).length > 0) {
                            await db.set(`shackData.${user.id}`, shackData);
                            message.channel.send(`data saved!`)
                        const dataSavedEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Data Saved!')
                        .setDescription('Your data has been successfully saved.');                
                        const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('profile')
                                .setLabel('Profile')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('analysis')
                                .setLabel('Analysis')
                                .setStyle(ButtonStyle.Primary)
                        );
                
                    // Send the embed and buttons as a response
                    await message.channel.send({ embeds: [dataSavedEmbed], components: [buttons] });
                    } else {
                        console.log(`Attempted to save empty userData for ${user.id}, operation skipped.`);
                    }
        
                    }
                } catch (error) {
                    console.error("Failed to collect reactions on TacoShack message:", error);
                }
            }  else if(validTitles.some(title => TitleEmbed.title && TitleEmbed.title.includes(title))){
                try {
                    await message.react('🔎');
                    console.log("Awaiting reactions to TacoShack bot message...");
                    
                    // Define reaction filter specific to TacoShack
                    const filter = (reaction, user) => reaction.emoji.name === '🔎' && !user.bot;
                    const collected = await message.awaitReactions({ filter, max: 1, time: 10000 });
                    const reaction = collected.first();
                    if (reaction) {
                        const user = reaction.users.cache.filter(u => !u.bot).first();
                        const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`View Data for ${user.username}`)
                        .setDescription('Click on the buttons to view your data.');                
                        const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('profile')
                                .setLabel('Profile')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('analysis')
                                .setLabel('Analysis')
                                .setStyle(ButtonStyle.Primary)
                        );
                
                    // Send the embed and buttons as a response
                    await message.channel.send({ embeds: [embed], components: [buttons] });

                    }
                } catch (error) {
                    console.error("Failed to collect reactions on TacoShack message:", error);
                }


            } else return;

            } else message.channel.send(`no embed!`);
        }
        });
    }
};

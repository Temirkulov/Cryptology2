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


function categorizeLocationAndExpansion(locationString) {
    const keywordToLocation = {
        "City Shack": {location: "city", expansionEmoji: "🌭"},
        "Amusement Park Shack": {location: "amusement", expansionEmoji: "🎡"},
        "Taco Shack": {location: "taco", expansionEmoji: "🚚"},
        "Mall Shack": {location: "mall", expansionEmoji: "🛒"},
        "Beach Shack": {location: "beach", expansionEmoji: "🍦"},
    };

    let categorizedLocation = "Unknown Location";
    let expansion = false;

    // Attempt to match location string to one of the keywords
    for (const [keyword, details] of Object.entries(keywordToLocation)) {
        if (locationString.includes(keyword)) {
            categorizedLocation = details.location;
            // Check if the expansion emoji is present in the location string
            expansion = locationString.includes(details.expansionEmoji);
            break; // Stop looping once a match is found
        }
    }

    return { categorizedLocation, expansion };
}
const donatorRanks = [
    "Gordon Ramsey",
    "Executive Chef",
    "Head Chef",
    "Sous Chef",
    "Apprentice Chef"
];

function extractDonatorRank(footerText) {
    for (let rank of donatorRanks) {
        if (footerText.includes(rank)) {
            return rank; // Return the matched rank
        }
    }
    return rank = "None"; // Return null if no rank is matched
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
                // console.log("Reacting to TacoShack bot message...")
                if (message.embeds.length > 0) {
                    
                    const validTitles = ["Upgrades", "Employees", "Decorations", "Advertisements"];
                    const TitleEmbed = message.embeds[0];
                    let donatorRank = null;
                    if (TitleEmbed.footer && TitleEmbed.footer.text) {
                        donatorRank = extractDonatorRank(TitleEmbed.footer.text);
                    }
            
                    const firstField = message.embeds[0].fields[0];
                    if (firstField && (firstField.name.includes("Shack Name") || firstField.value.includes("Shack Name"))) {
                        if(TitleEmbed.author) {
                            return;
                        }
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
                        const fields = embed.fields;
                        let extractedShackName = "";
                        // Test the function with a known footer string

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
                        console.log(userSetupData)
                        const userIds = Object.keys(userSetupData);
                        const matchedUserId = userIds.find(id => 
                            userSetupData[id].info && 
                            userSetupData[id].info.userid === user.id
                        );
                        console.log("Matched User ID:", matchedUserId);
                        const matchedShackName = userSetupData[matchedUserId].info.shackName;
                        console.log(matchedShackName)
                        if (!matchedUserId) {
                            await message.react('⚠️');
                            
                            console.log(`User ${user.username} not found in the database.`);
                            return;
                        } 

                        let userData = await db.get(`shackData.${user.id}`) || {};
        
                        // Update the userData with the extracted donator rank
                        userData.info.donatorRank = donatorRank;
                
                        // Save the updated data back to the database
                        await db.set(`shackData.${user.id}`, userData);
                        
                        console.log(`Data for ${user.username} updated with Donator Rank: ${donatorRank}`);
                        
                        
                        let shackData = await db.get(`shackData.${matchedUserId}`) || {};
                        console.log(`Shack Data for ${matchedUserId}:`, shackData);
                        if (!shackData) {
                            // Assuming defaultShackData is the default structure imported from shackDataStructure.js
                            shackData = JSON.parse(JSON.stringify(defaultShackData)); // Deep clone to avoid mutating the original
                        }
    
                        // console.log(JSON.stringify(shackData, null, 2)); // Before setting properties

                        fields.forEach(field => {    
                                                                        
                            switch (field.name) {
                                case 'Location':
                                    const locationValue = field.value; // The actual string value of the location field
                                    console.log(locationValue);
                                    // Use the new function to get both location and expansion status
                                    const { categorizedLocation, expansion } = categorizeLocationAndExpansion(locationValue);
                                    shackData.info.activeLocation = categorizedLocation;
                                    shackData.location[categorizedLocation].info.expansion = expansion;
                                    break;
                                    case 'Shack Name':
                                    const parts2 = field.value.split(' '); // Split the value by spaces
                                    let shackName = "";
                                    let expansionLevel = 0; // Initialize expansion level
                                    for (let part of parts2) {
                                        if (part.includes('(')) break; // Stop if the part includes a parenthesis
                                        if (shackName.length > 0) shackName += " "; // Add a space between parts
                                        shackName += part;
                                    }
                                    const activeLocation2 = categorizeLocation(embed.fields[2].value);
                                    console.log(activeLocation2)
                                    const locationKey = activeLocation2.toLowerCase(); // Ensure this matches your object keys accurately
                                    // Count taco emojis in the value string
                                    expansionLevel = (field.value.match(/🌮/g) || []).length;
                                    shackData.info.shackName = shackName.trim(); // Set the extracted shack name
                                    console.log(shackData.info.shackName)
                                    console.log(`location is ${shackData.location[locationKey]}`)
                                    console.log(`info is ${shackData.location[locationKey].info}`)
                                    shackData.location[locationKey].info.expansionLevel = expansionLevel; // Set the expansion level based on taco emoji count
                                    break;
                                case 'Franchise':
                                case 'Franchise | Recruiter':
                                case 'Franchise | Co-Owner':
                                case 'Franchise | Owner':
                                    shackData.info.franchise = field.value;
                                    // Dynamically determine the role based on the field name
                                    if (field.name.includes('Recruiter')) {
                                        shackData.info.franchiseStatus = 'Recruiter';
                                    } else if (field.name.includes('Co-Owner')) {
                                        shackData.info.franchiseStatus = 'Co-Owner';
                                    } else if (field.name.includes('Owner')) {
                                        shackData.info.franchiseStatus = 'Owner';
                                    } else {
                                        // Default case if none of the specific roles are matched
                                        shackData.info.franchiseStatus = 'employee';
                                    }
                                    break;
                                case 'Income (per hour)':
                                    const activeLocation1 = categorizeLocation(embed.fields[2].value);
                                    // Split the value to separate income and tacos per hour
                                    const incomeParts = field.value.split('|').map(part => part.trim());
                                    // Use regex to find matches for base income and boosts within brackets
                                    const incomeMatch = incomeParts[0].match(/\$(\d+(?:,\d+)*)(?: \(\+\$\d+(?:,\d+)*\/hr\))?/);
                                    // This regex looks for a dollar amount optionally followed by a boost amount in brackets
                                    if (incomeMatch) {
                                        const baseIncome = incomeMatch[1].replace(/,/g, ''); // Removes commas for conversion to number
                                        // Assuming you want to store the income as a number
                                        const locationKey = activeLocation1.toLowerCase(); // Ensure this matches your object keys accurately
                                        if (shackData.location[locationKey] && shackData.location[locationKey].info) {
                                            shackData.location[locationKey].info.income = Number(baseIncome);
                                        } else {
                                            console.warn(`Active location '${activeLocation1}' not found or missing info structure.`);
                                            console.log(`location key ${shackData[locationKey]}`)
                                        }
                                    }
                                
                                    // Handle tacos per hour part similarly if needed
                                    break;
                                case 'Balance':
                                    const balance = field.value.split('$')[1].replace(/,/g, '');
                                    const activeLocation = categorizeLocation(embed.fields[2].value);
                                
                                    // Ensure the location is valid and info structure exists
                                    if (shackData.location[activeLocation] && shackData.location[activeLocation].info) {
                                        shackData.location[activeLocation].info.balance = balance;
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
                                    const level = parseInt(field.value.split(' ')[2]);
                                    shackData.info.level = level;
                                    break;
                                // Add more cases as needed
                            }

                        });
                        // console.log(JSON.stringify(shackData, null, 2)); // After setting properties
                        const activeLocation = categorizeLocation(embed.fields[2].value);
                        console.log(shackData.location[activeLocation])
                        // After processing all fields, save userData under a single key
                        if (Object.keys(shackData).length > 0) {
                            await db.set(`shackData.${user.id}`, shackData);
                            // message.channel.send(`data saved!`)
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

            } else return;
        }
        });
    }
};

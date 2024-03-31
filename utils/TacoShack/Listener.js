const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const {
    // setActiveLocation,
    getNewShackDataInstance,
    // updateShackData,
    // parseEmbedDescription,
    // categorizeLocation,
    // categorizeEmbed
} = require('./dataUtilities');
const { defaultShackData } = require('./shackDataStructure');
function setActiveLocation(shackData, activeLocation) {
    // Ensure shackData and shackData.info are defined
    if (shackData && shackData.info) {
        shackData.info.activeLocation = activeLocation;
        console.log(`Active location set to '${activeLocation}'.`);
    } else {
        console.error("setActiveLocation called with undefined shackData or shackData.info");
    }
}


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
    if (embedTitle.includes("Upgrades")) return "upgrades";
    if (embedTitle.includes("Employees")) return "hire";
    if (embedTitle.includes("Decorations")) return "decorations";
    if (embedTitle.includes("Advertisements")) return "advertisements";
    if (embedTitle.includes("Taco Truck Upgrades")) return "truck";
    if (embedTitle.includes("Mall Kiosk Upgrades")) return "kiosk";
    if (embedTitle.includes("Ice Cream Stand Upgrades")) return "stand";
    if (embedTitle.includes("Amusement Park Attractions")) return "attractions";
    if (embedTitle.includes("Hotdog Cart Upgrades")) return "cart";

    // Add more conditions as necessary
    return "unknown"; // Default category
}
function parseHQEmbedDescription(description) {
    const parsedData = {
        upgrades: {},
        employees: {}
    };

    const lines = description.split('\n');
    lines.forEach(line => {
        let match = line.match(/^\*\*(.+?)\*\* \((\d+)\/\d+\)/);
        console.log(match)
        if (match) {
            const name = match[1].trim().replace(/\s+/g, '');
            const level = parseInt(match[2], 10);
            console.log(name, level)

            // Check if the name matches any known upgrade or employee
            if (name in parsedData.upgrades) {
                parsedData.upgrades[name] = level;
                console.log(parsedData.upgrades)
            } else if (name in parsedData.employees) {
                parsedData.employees[name] = level;
            }
        }
    });

    return parsedData;
}

async function handleEmbedUpdate(embed, userId) {
    // Determine the category from the embed title or content
    const category = categorizeEmbed(embed.title);

    // Parse the description to get the data
    const parsedData = parseEmbedDescription(embed.description);

    // Retrieve existing data or create a new instance
    let shackData = await db.get(`shackData.${userId}`) || getNewShackDataInstance();

    // Update the data in the correct category based on the parsed data
    updateShackData(shackData, category, parsedData, userId);
}



module.exports = {
    handleTacoShackMessageCreate: function (client) {
        client.on('messageCreate', message => {
            if (message.author.bot && message.author.id === '490707751832649738') {
                setTimeout(() => {
                    // console.log("Checking message after delay:", message.content); // Log message content for debugging
                    if (message.embeds.length > 0) {
                        const embed = message.embeds[0];
                        // console.log("Found embed:", embed); // Log the entire embed for debugging
                        embed.fields.forEach((field, index) => {
                            console.log(`Field ${index + 1}: Name: ${field.name}, Value: ${field.value}`)});            
        
                        if (embed.title ) {
                            message.reply({ content: embed.title });
                        } else {
                            // The embed does not have an author name
                            console.log({ content: "No author name" });
                        }
                    } else {
                        console.log("No embeds found in this message.");
                    }
                }, 3000); // Delay of 3000 milliseconds (3 seconds)
            }
        });
    },

    handleTacoShackMessageUpdate: function (client) {
        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.author.bot && newMessage.author.id === '490707751832649738') {
                if (newMessage.embeds.length > 0) {
                    const updatedEmbed = newMessage.embeds[0];
                    const validTitles = ["Upgrades", "Employees", "Decorations", "Advertisements", "Taco Truck Upgrades", "Mall Kiosk Upgrades", "Ice Cream Stand Upgrades", "Amusement Park Attractions", "Hotdog Cart Upgrades"];

                    
                    if (!validTitles.some(title => updatedEmbed.title && updatedEmbed.title.includes(title))) {
                        console.log("Embed title does not match the required criteria.");
                        return; // Exit if none of the keywords are found in the title
                    }
                
                    
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
                            if (title.includes('Employees') || title.includes('Upgrades')) {
                                const category = title.includes('Employees') ? 'employees' : 'upgrades';
                                const parsedHQData = parseHQEmbedDescription(newMessage.embeds[0].description);
                                
                                let shackData = await db.get(`shackData.${matchedUserId}`); // Fetch existing data
                                if (!shackData) {
                                    // Handle case where data does not exist
                                    console.log(`No shack data found for ${username}.`);
                                    return;
                                }
                        
                                // Update the HQ data in the shackData object
                                Object.assign(shackData.hq[category], parsedHQData[category]);
                        
                                // Save the updated data back to the database
                                await db.set(`shackData.${matchedUserId}.hq`, shackData.hq);
                                console.log(`HQ data updated for ${username}.`);
                            }
        
                        
                        updateShackData(shackData, category, parsedData, matchedUserId);

                        console.log(`Data updated for user ${username} at location ${activeLocation}.`);
                        checkUserData(matchedUserId).catch(console.error);

                    } else {
                        console.log("No footer found in the embed.");
                    }
                }
            }
        });
    }
            


};

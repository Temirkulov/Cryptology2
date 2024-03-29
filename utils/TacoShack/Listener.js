const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const {
    setActiveLocation,
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
    const regex = /^\*\*(.+?)\*\* \((\d+)\/(\d+)\) ✅\nBoost: \+(\$\d+|\w+)/gm;
    let match;
    const data = [];

    while ((match = regex.exec(description)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (match.index === regex.lastIndex) regex.lastIndex++;

        // Extracted data from the match
        data.push({
            name: match[1].trim().toLowerCase(), // Assuming you want the name in lowercase for uniformity
            progress: parseInt(match[2], 10), // Current progress
            boost: match[4] // Assuming boost could be a dollar amount or another measure
        });
    }

    return data;
}
function updateShackData(userShackData, dataUpdates) {
    if (!userShackData || !userShackData.info) {
        console.error("updateShackData was called with invalid userShackData structure:", userShackData);
        return;
    }

    const activeLocation = userShackData.info.activeLocation;

    // Validate activeLocation is one of the expected keys
    if (userShackData.location.hasOwnProperty(activeLocation)) {
        const locationData = userShackData.location[activeLocation];

        // Example of updating upgrades
        if (dataUpdates.upgrades) {
            Object.assign(locationData.upgrades, dataUpdates.upgrades);
        }

        // Similarly, update other parts like 'hire', 'decorations', etc., as needed
    } else {
        console.log(`Invalid or undefined activeLocation: ${activeLocation}`);
    }
}


function categorizeEmbed(embedTitle) {
    if (embedTitle.includes("Upgrades")) return "upgrades";
    if (embedTitle.includes("Employees")) return "hire";
    if (embedTitle.includes("Decorations")) return "decorations";
    // Add more conditions as necessary
    return "unknown"; // Default category
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
                            // The embed has an author name or title, reply with it
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
                    const validTitles = ["Upgrades", "Employees", "Decorations"];

                    
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
                        const parsedData = parseEmbedDescription(updatedEmbed.description);

                        // Retrieve all user data and find the user ID based on the username
                        const userSetupData = await db.get(`shackData`) || {};
                        const userIds = Object.keys(userSetupData);
                        const matchedUserId = userIds.find(id => 
                            userSetupData[id].info && 
                            userSetupData[id].info.username === username
                        );
                        console.log(matchedUserId);
                        console.log(category)
                        console.log(parsedData)
    
                        
                        if (!matchedUserId) {
                            await newMessage.react('⚠️');
                            console.log(`User ${username} not found in the database.`);
                            return;
                        } 
                        let userShackData = await db.get(`shackData.${matchedUserId}`) || getNewShackDataInstance();
                        if (!userShackData) {
                            userShackData = getNewShackDataInstance(); // Use your function to create a new instance with the default structure
                            // Optionally save this new instance to the database if needed
                            // await db.set(`shackData.${matchedUserId}`, userShackData);
                        }                        
                        console.log(`value for userShackData ${defaultShackData}`)
                        console.log(JSON.parse(JSON.stringify(defaultShackData)))
                        if (!userShackData) {
                            userShackData = JSON.parse(JSON.stringify(defaultShackData)); // Deep clone
                            // Now userShackData is a separate instance with the structure of defaultShackData
                        }
                        
                        console.log(`command log for ${userShackData}`)
                        // if (!userShackData) {
                        //     // Assuming defaultShackData is the default structure imported from shackDataStructure.js
                        //     userShackData = JSON.parse(JSON.stringify(defaultShackData)); // Deep clone to avoid mutating the original
                        // }
                        console.log("Before calling setActiveLocation:", JSON.stringify(userShackData, null, 2));

                        setActiveLocation(userShackData, activeLocation);
                        updateShackData(category, parsedData, userShackData);
                        await db.set(`shackData.${username}`, userShackData);

                        console.log(`Data updated for user ${username} at location ${activeLocation}.`);
    
                    } else {
                        console.log("No footer found in the embed.");
                    }
                }
            }
        });
    }
            


};

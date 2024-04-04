const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const shackData = require('./shackData.json');
const upgradeDefinitions = require('./shackData.json').locations; // Load upgrade definitions

// async function calculateCurrentUserIncome(userId) {
//     const userData = await db.get(`shackData.${userId}`);
//     if (!userData) {
//         console.log(`No user data found for user ID ${userId}`);
//         return 0;
//     }
//     const specialSectionMapping = {
//         taco: 'truck',
//         beach: 'stand',
//         city: 'cart',
//         amusement: 'attractions',
//         mall: 'kiosk',
//         // Add other mappings as needed
//       };
      
//     const activeLocation = userData.info.activeLocation;
//     const locationUpgrades = userData.location[activeLocation].upgrades;
//     const locationHire = userData.location[activeLocation].hire;
//     const locationDecorations = userData.location[activeLocation].decorations;
//     const locationAdvertisements = userData.location[activeLocation].advertisements;
//     const specialSectionName = specialSectionMapping[activeLocation];
//     const specialSection = userData.location[activeLocation][specialSectionName] || {};

//     const upgradeDefinitions = shackData.locations[activeLocation];

//     let totalIncome =  0; // Start with base income
//     // userData.location[activeLocation].info.income ||
//     // Process upgrades
//     for (const upgradeType in locationUpgrades) {
//         const userUpgradeLevel = locationUpgrades[upgradeType];
//         const upgradeDef = upgradeDefinitions.upgrades[upgradeType];
//         if (upgradeDef) {
//             totalIncome += userUpgradeLevel * upgradeDef.boost;
//         } else {
//             console.log(`Definition not found for upgrade: ${upgradeType} in location: ${activeLocation}`);
//         }
//     }
//     // Process decorations
//     for (const decoType in locationDecorations) {
//         const userDecorationsLevel = locationDecorations[decoType];
//         const decoDef = upgradeDefinitions.decorations[decoType];
//         if (decoDef) {
//             totalIncome += userDecorationsLevel * decoDef.boost;
//         } else {
//             console.log(`Definition not found for upgrade: ${decoType} in location: ${activeLocation}`);
//         }
//     }
//     // Process advertisements
//     for (const adType in locationAdvertisements) {
//         const userAdvertisementsLevel = locationAdvertisements[adType];
//         const adDef = upgradeDefinitions.advertisements[adType];
//         if (adDef) {
//             totalIncome += userAdvertisementsLevel * adDef.boost;
//         } else {
//             console.log(`Definition not found for upgrade: ${adType} in location: ${activeLocation}`);
//         }
//     }



//     // Process hires
//     for (const hireType in locationHire) {
//         const userHireLevel = locationHire[hireType];
//         const hireDef = upgradeDefinitions.hire[hireType];
//         if (hireDef) {
//             totalIncome += userHireLevel * hireDef.boost;
//         } else {
//             console.log(`Definition not found for hire: ${hireType} in location: ${activeLocation}`);
//         }
//     }
//         // Process special section
//         for (const specialUpgradeType in specialSection) {
//             const userUpgradeLevel = specialSection[specialUpgradeType];
//             const upgradeDef = upgradeDefinitions[specialSectionName][specialUpgradeType];
//             if (upgradeDef) {
//                 totalIncome += userUpgradeLevel * upgradeDef.boost;
//             } else {
//                 console.log(`Definition not found for special upgrade: ${specialUpgradeType} in section: ${specialSectionName}`);
//             }
//         }
    

//     console.log(`Total income for user ${userId} is: ${totalIncome}`);
//     return totalIncome;
// }
const expansionMapping = {
    taco: 'truck',
    city: 'cart',
    beach: 'stand',
    amusement: 'attractions',
    mall: 'kiosk',
    // Add other locations as necessary
};

function calculateNextLevelCost(level, initialCost) {
    // Formula to calculate the cost of the next level upgrade
    return (level * level) * initialCost;
}


// async function calculateOptimalUpgrades(userId) {
//     const userData = await db.get(`shackData.${userId}`) || {}; // Provide an empty object as default
//     if (Object.keys(userData).length === 0) {
//         console.log(`No data found for user ${userId}.`);
//         // Handle the case of missing data, such as notifying the user or exiting the function
//         return;
//     }
//     const activeLocation = userData.info.activeLocation;
//     const expansionActive = userData.location[activeLocation].info.expansion; // true or false
//     const locationData = userData.location[activeLocation];
//     const locationUpgradeDefinitions = upgradeDefinitions[activeLocation];

//     let allUpgrades = [];

//     const types = ['upgrades', 'hire', 'decorations', 'advertisements'];
//     if (expansionActive) {
//         // Add expansion specific section if expansion is active
//         types.push(expansionMapping[activeLocation]);
//     }

//     types.forEach(type => {
//         const upgradesOfType = locationData[type];
//         if (!upgradesOfType) return; // Skip if no upgrades of this type
    
//         Object.entries(upgradesOfType).forEach(([upgradeName, currentLevel]) => {
//             const upgradeDef = locationUpgradeDefinitions[type]?.[upgradeName];
//             if (!upgradeDef) {
//                 console.log(`No definition found for upgrade: ${upgradeName}`);
//                 return;
//             }
    
//             const maxLevel = upgradeDef.max || 0;
//             if (currentLevel < maxLevel) {
//                 const nextLevelCost = calculateNextLevelCost(currentLevel + 1, upgradeDef.initialPrice);
//                 // This represents the cost for every $1 of income added, lower is better
//                 const costPerIncome = nextLevelCost / upgradeDef.boost;
//                 allUpgrades.push({ upgradeName, nextLevel: currentLevel + 1, nextLevelCost, boost: upgradeDef.boost, costPerIncome, type });
//             }
//         });
//     });
    
//     // Sort by costPerIncome to find the most cost-effective upgrades first
//     allUpgrades.sort((a, b) => a.costPerIncome - b.costPerIncome);

//     const prioritizedUpgrades = ['tipjar', 'appliances'];
//     allUpgrades = allUpgrades.sort((a, b) => {
//         if (prioritizedUpgrades.includes(a.upgradeName) && !prioritizedUpgrades.includes(b.upgradeName)) {
//             return -1; // Prioritize a
//         } else if (!prioritizedUpgrades.includes(a.upgradeName) && prioritizedUpgrades.includes(b.upgradeName)) {
//             return 1; // Prioritize b
//         }
//         return a.costPerIncome - b.costPerIncome; // Then sort by costPerIncome
//     });
    

//     //     // Prioritize tipjar and appliances upgrades
//     // const priorityUpgrades = ['tipjar', 'appliances'];
//     // allUpgrades = allUpgrades.sort((a, b) => priorityUpgrades.includes(a.upgradeName) ? -1 : (priorityUpgrades.includes(b.upgradeName) ? 1 : b.roi - a.roi));

//     // // Assuming you only want the top 15 upgrades
//     return allUpgrades.slice(0, 15);
// }

// // Example usage
// calculateOptimalUpgrades('userId').then(optimalUpgrades => {
//     console.log(optimalUpgrades);
//     // Further processing, such as displaying these in a Discord embed, would go here
// });

// async function getRecommendedUpgradesWithPriority(userId) {
//     // Calculate all optimal upgrades without considering priority
//     const optimalUpgrades = await calculateOptimalUpgrades(userId);

//     // Prioritize 'tipjar' and 'appliances' by moving them to the front if they are not maxed out
//     const priorityUpgrades = ['tipjar', 'appliances'];
//     const prioritizedUpgrades = [];

//     priorityUpgrades.forEach(priority => {
//         const foundIndex = optimalUpgrades.findIndex(upgrade => upgrade.upgradeName === priority);
//         if (foundIndex !== -1) {
//             // Remove from current position and add to the start
//             const [priorityUpgrade] = optimalUpgrades.splice(foundIndex, 1);
//             prioritizedUpgrades.push(priorityUpgrade);
//         }
//     });

//     // Combine the prioritized upgrades with the rest, limiting to the next 15 upgrades
//     const recommendedUpgrades = prioritizedUpgrades.concat(optimalUpgrades).slice(0, 15);

//     return recommendedUpgrades;
// }

// Prepare the Discord embed

async function prepareUpgradeRecommendationEmbed(userId, selectedLocation = null) {
    const userData = await db.get(`shackData.${userId}`) || {};
    // Determine the location to use for the calculation - either the selected one or the user's current active location
    const activeLocation = selectedLocation || userData.info.activeLocation;
    const result = await calculateDynamicOptimalUpgrades(userId, activeLocation); // Updated to pass selectedLocation
    const beautifiedLocation = beautifyLocation(activeLocation); // Use the updated activeLocation

    let description = result.upgrades.map((upgrade, index) => {
        return `**${index + 1}.** \`${capitalizeFirstLetter(upgrade.upgradeName)}\` - $${formatNumber(upgrade.nextLevelCost)}`;
    }).join('\n');

    if (result.upgrades.length < 15) {
        description += '\n\n*Some upgrades may have reached their maximum level.*';
    }

    description += `\n\n**Total Cost**: $${formatNumber(result.totalCost)}`;

    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Optimal Upgrades Recommendation')
        .setDescription(description)
        .setFooter({ text: `Upgrades for: ${beautifiedLocation}\nTo update your data, use the select menu below.` });

    // Define the select menu for location selection
    const selectMenu = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('select_location')
                .setPlaceholder('Choose a location')
                .addOptions([
                    { label: 'City Shack', value: 'city' },
                    { label: 'Amusement Park Shack', value: 'amusement' },
                    { label: 'Taco Shack', value: 'taco' },
                    { label: 'Mall Shack', value: 'mall' },
                    { label: 'Beach Shack', value: 'beach' },
                ])
        );

    return { embeds: [embed], components: [selectMenu] };
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to format numbers with commas
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
async function calculateDynamicOptimalUpgrades(userId, selectedLocation) {
    const userData = await db.get(`shackData.${userId}`) || {};
    if (Object.keys(userData).length === 0) {
        console.log(`No data found for user ${userId}.`);
        return { upgrades: [], totalCost: 0 };
    }

    // const activeLocation = userData.info.activeLocation;
    const activeLocation = selectedLocation
    const expansionActive = userData.location[activeLocation].info.expansion; // true or false
    const locationData = userData.location[activeLocation];
    const locationUpgradeDefinitions = upgradeDefinitions[activeLocation]; // Make sure this correctly points to your upgrades definitions.

    let availableUpgrades = [];
    let selectedUpgrades = [];
    let totalCost = 0;

    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];
    if (expansionActive) {
        types.push(expansionMapping[activeLocation]);
    }

    // Initialize all upgrades
    types.forEach(type => {
        const upgradesOfType = locationData[type];
        if (!upgradesOfType) return;

        Object.entries(upgradesOfType).forEach(([upgradeName, currentLevel]) => {
            const upgradeDef = locationUpgradeDefinitions[type]?.[upgradeName];
            if (!upgradeDef || currentLevel >= upgradeDef.max) return;

            availableUpgrades.push({ upgradeName, currentLevel, type });
        });
    });

    // Dynamically select the next optimal upgrades
    for (let i = 0; i < 15; i++) {
        let bestUpgrade = null;
        let bestCostPerIncome = Infinity;

        availableUpgrades.forEach(upgrade => {
            const upgradeDef = locationUpgradeDefinitions[upgrade.type]?.[upgrade.upgradeName];
            const nextLevelCost = calculateNextLevelCost(upgrade.currentLevel + 1, upgradeDef.initialPrice);
            const costPerIncome = nextLevelCost / upgradeDef.boost;

            if (costPerIncome < bestCostPerIncome) {
                bestUpgrade = { ...upgrade, nextLevelCost, boost: upgradeDef.boost, costPerIncome };
                bestCostPerIncome = costPerIncome;
            }
        });

        if (!bestUpgrade) break;

        // Update the selected upgrade's level for future iterations
        const upgradeIndex = availableUpgrades.findIndex(upgrade => upgrade.upgradeName === bestUpgrade.upgradeName);
        availableUpgrades[upgradeIndex].currentLevel += 1;
        if (availableUpgrades[upgradeIndex].currentLevel >= locationUpgradeDefinitions[availableUpgrades[upgradeIndex].type]?.[availableUpgrades[upgradeIndex].upgradeName].max) {
            // Remove the upgrade if it has reached its max level
            availableUpgrades.splice(upgradeIndex, 1);
        }

        selectedUpgrades.push(bestUpgrade);
        totalCost += bestUpgrade.nextLevelCost;
    }

    // Prioritize 'tipjar' and 'appliances' by ensuring they are at the front if they appear
    const priorityUpgrades = ['tipjar', 'appliances'];
    const prioritizedUpgrades = selectedUpgrades.sort((a, b) => priorityUpgrades.indexOf(a.upgradeName) - priorityUpgrades.indexOf(b.upgradeName));

    return { upgrades: prioritizedUpgrades, totalCost };
}

function updateUpgradeCostAndRoi(allUpgrades, selectedUpgrade, definitions) {
    const upgradeIndex = allUpgrades.findIndex(upgrade => upgrade.upgradeName === selectedUpgrade.upgradeName);
    if (upgradeIndex !== -1) {
        const upgradeDef = definitions[selectedUpgrade.type]?.[selectedUpgrade.upgradeName];
        const nextLevel = selectedUpgrade.currentLevel + 1;
        if (nextLevel < upgradeDef.max) {
            const nextLevelCost = calculateNextLevelCost(nextLevel + 1, upgradeDef.initialPrice);
            const roi = nextLevelCost / upgradeDef.boost;
            allUpgrades[upgradeIndex] = { ...allUpgrades[upgradeIndex], currentLevel: nextLevel, nextLevelCost, roi };
        } else {
            allUpgrades.splice(upgradeIndex, 1); // Remove the upgrade if it has reached its max level
        }
    }
}

// Prioritize specific upgrades by moving them to the front of the list
function prioritizeUpgrades(upgrades, priorities) {
    const prioritizedUpgrades = priorities.map(priority => 
        upgrades.find(upgrade => upgrade.upgradeName === priority)
    ).filter(Boolean); // Remove undefined values
    
    const nonPrioritizedUpgrades = upgrades.filter(upgrade => 
        !priorities.includes(upgrade.upgradeName)
    );
    
    return [...prioritizedUpgrades, ...nonPrioritizedUpgrades];
}

function beautifyLocation(activeLocationKey) {
    const locationMap = {
        city: "🏙 City Shack",
        amusement: "🎢 Amusement Park Shack",
        taco: "🌮 Taco Shack",
        mall: "🏬 Mall Shack",
        beach: "⛱ Beach Shack"
    };
    
    // Return the beautified version if found, else default to the key itself
    return locationMap[activeLocationKey] || activeLocationKey;
}



module.exports = {
    analysisHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            // Handle button interaction as before
            if (interaction.isButton() && interaction.customId === 'analysis') {
                const userId = interaction.user.id;
                const { embeds, components } = await prepareUpgradeRecommendationEmbed(userId);
                await interaction.reply({ embeds, components });
            }
            // Handle select menu interaction
            if (interaction.isSelectMenu() && interaction.customId === 'select_location') {
                const userId = interaction.user.id;
                const selectedLocation = interaction.values[0];
                const { embeds, components } = await prepareUpgradeRecommendationEmbed(userId, selectedLocation);
                await interaction.update({ embeds, components });
            }
        });
    }
};

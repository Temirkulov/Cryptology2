const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
async function prepareUpgradeRecommendationEmbed(userId) {
    const optimalUpgrades = await calculateDynamicOptimalUpgrades(userId);
    // const optimalUpgradesText = optimalUpgrades.map((upgrade, index) =>
    //     `**${index + 1}. ${upgrade.upgradeName.charAt(0).toUpperCase() + upgrade.upgradeName.slice(1)}**`
    // ).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Optimal Upgrades Recommendation')
        .setDescription('Here are your recommended upgrades:')
        .setTimestamp()
        optimalUpgrades.forEach((upgrade, index) => {
            const name = `**${index + 1}. ${upgrade.upgradeName.charAt(0).toUpperCase() + upgrade.upgradeName.slice(1)}**`; // Capitalize the first letter
            const details = `Next Level: ${upgrade.nextLevel} - Cost: $${upgrade.nextLevelCost.toLocaleString()}, Boost: +${upgrade.boost}/hr`;
            embed.addFields({ name, 
                value: details, inline: true });
        });

    return embed;
}

async function calculateDynamicOptimalUpgrades(userId, totalRecommendations = 15) {
    const userData = await db.get(`shackData.${userId}`) || {};
    if (!userData.info || !userData.location) {
        console.log(`No data found for user ${userId}.`);
        return [];
    }
    
    // Assuming this is how you get the active location and its data
    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    // Replace 'upgradeDefinitionsPath' with the actual path to your upgrade definitions
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];
    
    let recommendations = [];
    let upgradeCandidates = [];

    // Initialize candidates with current levels and basic info
    for (let type in locationData) {
        for (let name in locationData[type]) {
            let def = upgradeDefinitions[type][name];
            if (def) {
                upgradeCandidates.push({
                    name,
                    type,
                    currentLevel: locationData[type][name],
                    maxLevel: def.max,
                    initialPrice: def.initialPrice,
                    boost: def.boost,
                    nextLevelCost: calculateNextLevelCost(locationData[type][name] + 1, def.initialPrice),
                });
            }
        }
    }

    // Function to update candidates' nextLevelCost and sort by cost effectiveness
    function updateAndSortCandidates() {
        upgradeCandidates.forEach(candidate => {
            candidate.nextLevelCost = calculateNextLevelCost(candidate.currentLevel + 1, candidate.initialPrice);
            candidate.costPerIncome = candidate.nextLevelCost / candidate.boost; // Adjust if using a different metric
        });

        // Sort by costPerIncome, lowest first
        upgradeCandidates.sort((a, b) => a.costPerIncome - b.costPerIncome);
    }

    // Generate recommendations
    while (recommendations.length < totalRecommendations && upgradeCandidates.length > 0) {
        updateAndSortCandidates();
        let bestCandidate = upgradeCandidates[0];

        // Check if it's still under maxLevel and add to recommendations
        if (bestCandidate.currentLevel < bestCandidate.maxLevel) {
            recommendations.push({ ...bestCandidate, nextLevel: bestCandidate.currentLevel + 1 });
            bestCandidate.currentLevel++; // Prepare for next iteration
        } else {
            // Remove from candidates if maxed out
            upgradeCandidates.shift();
        }
    }

    return recommendations;
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



module.exports = {
    analysisHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton() && interaction.customId === 'analysis') {
                const userId = interaction.user.id;
                const embed = await prepareUpgradeRecommendationEmbed(userId);
                await interaction.reply({ embeds: [embed] });
                    }
        });
    }};
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

    
const expansionMapping = {
    taco: 'truck',
    city: 'cart',
    beach: 'stand',
    amusement: 'attractions',
    mall: 'kiosk',
    // Add other locations as necessary
};

async function calculateDynamicOptimalUpgrades(userId, selectedLocation) {
    const userData = await db.get(`shackData.${userId}`) || {};
    if (Object.keys(userData).length === 0) {
        console.log(`No data found for user ${userId}.`);
        return { upgrades: [], totalCost: 0 };
    }
    const upgradeDefinitions = require('./shackData.json').locations; // Make sure this correctly points to your upgrades definitions.
    // const activeLocation = userData.info.activeLocation;
    const activeLocation = selectedLocation || userData.info.activeLocation;
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



// Calculate the next level cost based on your pricing formula
function calculateNextLevelCost(level, initialPrice) {
    return (level * level) * initialPrice;
}

async function calculatePercentageMaxed(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return 0; // No data found for user
    }

    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];

    let totalUpgrades = 0;
    let maxedUpgrades = 0;
    const expansionLevel = locationData.info.expansionLevel; // Assuming this exists and is a number
    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];

    if (locationData.info.expansion) {
        types.push(expansionMapping[activeLocation]); // Ensure expansionMapping is defined somewhere globally
    }

    types.forEach(type => {
        const upgradesOfType = locationData[type];
        if (!upgradesOfType) return;

        Object.entries(upgradesOfType).forEach(([upgradeName, currentLevel]) => {
            // Determine the max level dynamically based on the expansion level
            const maxKey = `max${expansionLevel}`; // Constructs the key dynamically e.g., "max0", "max1", etc.
            const defaultMaxKey = 'max'; // Use this if the specific max for expansionLevel doesn't exist
            const maxLevel = upgradeDefinitions[type]?.[upgradeName]?.[maxKey] || upgradeDefinitions[type]?.[upgradeName]?.[defaultMaxKey] || 0;

            totalUpgrades++;
            if (currentLevel >= maxLevel) {
                maxedUpgrades++;
            }
        });
    });

    // Calculate percentage
    const percentageMaxed = totalUpgrades > 0 ? (maxedUpgrades / totalUpgrades) * 100 : 0;
    return percentageMaxed;
}
async function calculateFinancialProgress(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return { percentageMaxed: 0, totalSpent: 0, totalToMax: 0, totalLeft: 0 };
    }

    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];

    let totalSpent = 0;
    let totalToMax = 0;
    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];

    if (locationData.info.expansion) {
        types.push(expansionMapping[activeLocation]); // Ensure this is defined to match your data
    }

    types.forEach(type => {
        const upgradesOfType = locationData[type];
        if (!upgradesOfType) return;

        Object.entries(upgradesOfType).forEach(([upgradeName, currentLevel]) => {
            const upgradeDef = upgradeDefinitions[type]?.[upgradeName];
            if (!upgradeDef) return;

            // Cap the current level at the maximum if it exceeds due to a glitch
            const effectiveCurrentLevel = Math.min(currentLevel, upgradeDef.max);

            // Calculate the cost to reach the effective current level for each upgrade
            for (let level = 1; level <= effectiveCurrentLevel; level++) {
                totalSpent += calculateNextLevelCost(level, upgradeDef.initialPrice);
            }

            // Calculate the total cost to max for each upgrade
            for (let level = 1; level <= upgradeDef.max; level++) {
                totalToMax += calculateNextLevelCost(level, upgradeDef.initialPrice);
            }
        });
    });

    const percentageMaxed = totalToMax > 0 ? (totalSpent / totalToMax) * 100 : 0;

    return { 
        percentageMaxed: percentageMaxed.toFixed(2), 
        totalSpent: totalSpent.toLocaleString(), 
        totalToMax: totalToMax.toLocaleString(), 
        totalLeft: (totalToMax - totalSpent).toLocaleString()
    };
}

async function calculateIncomeDetails(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return null;
    }

    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];
    
    // Base incomes
    const franchiseIncome = 9900;
    const hqIncome = 4500; // Current HQ income
    const maxHqIncome = 14000; // Maximum HQ income
    const menuIncome = 2600;
    const levelIncome = 1700;

    let actualIncome = levelIncome + franchiseIncome + hqIncome + menuIncome;
    let maxedIncome = levelIncome + franchiseIncome + hqIncome + menuIncome;
    let fullyMaxedIncome = levelIncome + franchiseIncome + maxHqIncome + menuIncome;

    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];
    if (locationData.info.expansion) {
        types.push(expansionMapping[activeLocation]); // Ensure this is defined to match your data structure
    }

    const calculateIncomeForType = (typeData, upgradeDef, max = false) => {
        let income = 0;
        Object.entries(typeData).forEach(([upgradeName, level]) => {
            const upgrade = upgradeDef[upgradeName];
            if (!upgrade) return;
            const effectiveLevel = max ? upgrade.max : level;
            income += effectiveLevel * upgrade.boost;
        });
        return income;
    };

    types.forEach(type => {
        const typeData = locationData[type] || {};
        actualIncome += calculateIncomeForType(typeData, upgradeDefinitions[type]);
        maxedIncome += calculateIncomeForType(typeData, upgradeDefinitions[type], true);
    });

    // Assuming storedCurrentIncome is the income value stored for the active location
    const storedCurrentIncome = locationData.info.income;
    const glitchedIncome = storedCurrentIncome - actualIncome;
    
    const currentMaxedIncome = maxedIncome + glitchedIncome; // Maxed income adjusted for glitches
    fullyMaxedIncome +=  maxedIncome + glitchedIncome - (hqIncome); // Fully maxed income with maximum HQ benefit and adjusted for glitches
    let potentialCurrentIncome = currentMaxedIncome - storedCurrentIncome

    return {
        actualIncome,
        glitchedIncome,
        maxedIncome,
        currentMaxedIncome,
        fullyMaxedIncome,
        potentialCurrentIncome,
        storedCurrentIncome
    };
}

async function calculateCurrentAndPotentialIncome(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return { currentIncome: 0, potentialIncome: 0 };
    }

    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];

    let currentIncome = locationData.info.income || 0; // Assuming base income is stored at this path
    let potentialIncome = currentIncome;

    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];
    const franchiseIncomeBonus = 9900; // Define as per actual value
    const hqIncome = userData.hq.info.income || 0; // Assuming hq income is stored at this path
    const menuBonus = 2600; // Define as per actual value


    types.forEach(type => {
        Object.entries(locationData[type]).forEach(([upgradeName, level]) => {
            const upgradeDef = upgradeDefinitions[type]?.[upgradeName];
            if (upgradeDef) {
                currentIncome += level * upgradeDef.boost;
                potentialIncome += upgradeDef.max * upgradeDef.boost;
            }
        });
    });

    // Add constant incomes to both current and potential income
    currentIncome += franchiseIncomeBonus + hqIncome + menuBonus;
    potentialIncome += franchiseIncomeBonus + hqIncome + menuBonus; // Assuming these bonuses also apply to potential income

    return { currentIncome, potentialIncome };
}

module.exports = {
    profileHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton() && interaction.customId === 'profile') {
                const userId = interaction.user.id;
                
                // Use the functions to gather data for the user
                const optimalUpgradesData = await calculateDynamicOptimalUpgrades(userId, null); // Using null for selectedLocation as a default
                const financialProgress = await calculateFinancialProgress(userId);
                const percentageMaxed = await calculatePercentageMaxed(userId);
                const incomeDetails = await calculateIncomeDetails(userId);
                // const glitchedIncome = await calculateGlitchedIncome(userId);
                
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${interaction.user.username}'s Profile`)
                    .setDescription(`Your profile details and upgrade recommendations.`)
                    .addFields(
                        { name: 'Percentage Maxed', value: `${financialProgress.percentageMaxed}%`, inline: true },
                        { name: 'Current Income', value: `$${incomeDetails.storedCurrentIncome}`, inline: true },
                        { name: 'Potential Income', value: `$${financialProgress.potentialCurrentIncome}`, inline: true },
                        { name: 'Total Cost for Recommended Upgrades', value: `$${optimalUpgradesData.totalCost.toLocaleString()}`, inline: false },
                        { name: 'Total Spent', value: `$${financialProgress.totalSpent}`, inline: true },
                        { name: 'Total to Max', value: `$${financialProgress.totalToMax}`, inline: true },
                        { name: 'Total Left to Max', value: `$${financialProgress.totalLeft}`, inline: true },
                        { name: 'Actual Income', value: `$${incomeDetails.actualIncome.toLocaleString()}`, inline: true },
                        { name: 'Glitched Income', value: `$${incomeDetails.glitchedIncome.toLocaleString()}`, inline: true },
                        { name: 'Maxed Income (Current)', value: `$${incomeDetails.maxedIncome.toLocaleString()}`, inline: true },
                        { name: 'Maxed Income (With Glitch)', value: `$${incomeDetails.currentMaxedIncome.toLocaleString()}`, inline: true },
                        { name: 'Fully Maxed Income (No Glitch)', value: `$${incomeDetails.fullyMaxedIncome.toLocaleString()}`, inline: true }
    
                    )
                    // You can add more fields based on the data you have
                    
                await interaction.reply({ embeds: [embed] });
            }
        });
    }
};









// module.exports = {
//     profileHandler: function (client) {
//         client.on('interactionCreate', async (interaction) => {
//             if (interaction.isButton() && interaction.customId === 'profile') {
//                 const userId = interaction.user.id;
                
//                 // Use the functions to gather data for the user
//                 const optimalUpgradesData = await calculateDynamicOptimalUpgrades(userId, null); // Assuming null for selectedLocation means use active location
//                 const percentageMaxed = await calculatePercentageMaxed(userId);
//                 const incomeData = await calculateCurrentAndPotentialIncome(userId);
//                 const glitchedIncome = await calculateGlitchedIncome(userId);
                
//                 const embed = new EmbedBuilder()
//                     .setColor('#0099ff')
//                     .setTitle(`${interaction.user.username}'s Profile`)
//                     .setDescription(`Your profile details and upgrade recommendations.`)
//                     .addFields(
//                         { name: 'Percentage Maxed', value: `${percentageMaxed}%`, inline: true },
//                         { name: 'Current Income', value: `$${incomeData.currentIncome}`, inline: true },
//                         { name: 'Potential Income', value: `$${incomeData.potentialIncome}`, inline: true },
//                         { name: 'Glitched Income', value: `$${glitchedIncome}`, inline: true },
//                         { name: 'Total Cost for Recommended Upgrades', value: `$${optimalUpgradesData.totalCost}`, inline: false }
//                     )
//                     // You can add more fields based on the data you have
                    
//                 await interaction.reply({ embeds: [embed] });
//             }
//         });
//     }
// };

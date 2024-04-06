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
function getFranchiseStatusIncomeBonus(franchiseStatus) {
    switch (franchiseStatus) {
        case 'Employee':
            return 100;
        case 'Recruiter':
            return 150;
        case 'Co-Owner':
            return 250;
        case 'Owner':
            return 300;
        default:
            return 0; // Default case if no match is found
    }
}
function getLevelIncomeBonus(level) {
    let incomeBonus = 0;

    if (level >= 5) incomeBonus += 100; // Add bonus for reaching level 5
    if (level >= 10) incomeBonus += 150; // Add bonus for reaching level 10, and so on...
    if (level >= 15) incomeBonus += 200;
    if (level >= 20) incomeBonus += 250;
    if (level >= 25) incomeBonus += 400;
    if (level >= 30) incomeBonus += 600;

    return incomeBonus;
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
    
    // Utility incomes
    const franchiseIncomeBonus = getFranchiseStatusIncomeBonus(userData.info.franchiseStatus);
    const levelIncomeBonus = getLevelIncomeBonus(userData.info.level);
    const franchiseIncome = 9800+franchiseIncomeBonus;
    const hqIncome = userData.hq.info.income;
    const menuIncome = 2600;
    const maxHqIncome = 14000;
    const levelIncome = levelIncomeBonus;
    const maxLevelIncome = 1700;
    let actualIncome = levelIncome + franchiseIncome + hqIncome + menuIncome;
    let maxedIncome = levelIncome + franchiseIncome + hqIncome + menuIncome;
    let fullyMaxedIncome = maxLevelIncome + franchiseIncome + maxHqIncome + menuIncome;

    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];
    if (locationData.info.expansion) {
        types.push(expansionMapping[activeLocation]); // Ensure this is defined to match your data structure
        actualIncome += 1000;
        maxedIncome += 1000;
        fullyMaxedIncome += 1000;
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
        fullyMaxedIncome += calculateIncomeForType(typeData, upgradeDefinitions[type], true);
    });

    // Assuming storedCurrentIncome is the income value stored for the active location
    const storedCurrentIncome = locationData.info.income;
    const glitchedIncome = storedCurrentIncome - actualIncome;
    const currentMaxedIncome = maxedIncome + glitchedIncome; // Maxed income adjusted for glitches
    const potentialCurrentIncome = currentMaxedIncome - storedCurrentIncome
    const hqmaxdifference = maxHqIncome - hqIncome;
    const currentMaxHQincome = currentMaxedIncome + hqmaxdifference; // Current income with maximum HQ benefit

    return {
        actualIncome,
        glitchedIncome,
        maxedIncome,
        currentMaxedIncome,
        fullyMaxedIncome,
        potentialCurrentIncome,
        storedCurrentIncome,
        currentMaxHQincome
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
    profileHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton() && interaction.customId === 'profile') {
                const userId = interaction.user.id;
                const userData = await db.get(`shackData.${userId}`) || {};
                // Use the functions to gather data for the user
                const optimalUpgradesData = await calculateDynamicOptimalUpgrades(userId, null); // Using null for selectedLocation as a default
                const financialProgress = await calculateFinancialProgress(userId);
                const percentageMaxed = await calculatePercentageMaxed(userId);
                const incomeDetails = await calculateIncomeDetails(userId);
                // const glitchedIncome = await calculateGlitchedIncome(userId);
                const beautifiedLocation = beautifyLocation(userData.info.activeLocation);
                const embed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle(`${interaction.user.username}'s Profile`)
                .setDescription(`**Profile Income Analysis**`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: `${interaction.user.username} | ${beautifiedLocation}` })
                .addFields(
                    // Group related financial progress details together
                    { name: 'Financial Progress', value: `**Percentage Maxed**: ${financialProgress.percentageMaxed}%\n**Total Spent**: $${financialProgress.totalSpent.toLocaleString()}\n**Total to Max**: $${financialProgress.totalToMax.toLocaleString()}\n**Total Left to Max**: $${financialProgress.totalLeft.toLocaleString()}`, inline: false },
            
                    // Group income details together
                    { name: 'Income Analysis', value: `**Current Income**: $${incomeDetails.storedCurrentIncome.toLocaleString()}\n**Income Left**: $${incomeDetails.potentialCurrentIncome.toLocaleString()}\n**Current Income (Max HQ)**: $${incomeDetails.currentMaxHQincome.toLocaleString()}\n**Actual Income**: $${incomeDetails.actualIncome.toLocaleString()}\n**Maxed Income**: $${incomeDetails.maxedIncome.toLocaleString()}`, inline: false },
            
                    // Glitched Income details
                    { name: 'Glitched Income Analysis', value: `**Glitched Income**: $${incomeDetails.glitchedIncome.toLocaleString()}\n**Maxed Income (With Glitch)**: $${incomeDetails.currentMaxedIncome.toLocaleString()}\n**Fully Maxed Income**: $${incomeDetails.fullyMaxedIncome.toLocaleString()}`, inline: false }
                )
                await interaction.reply({ embeds: [embed] });
            }
        });
    }
};




// Path: Cryptology2/utils/TacoShack/Profile.js
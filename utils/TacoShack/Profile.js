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
async function calculateFinancialProgress(userId, locationKey) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return { percentageMaxed: 0, totalSpent: 0, totalToMax: 0, totalLeft: 0 };
    }

    const locationData = userData.location[locationKey];
    const upgradeDefinitions = require('./shackData.json').locations[locationKey];

    let totalSpent = 0;
    let totalToMax = 0;
    const types = ['upgrades', 'hire', 'decorations', 'advertisements'];

    if (locationData.info.expansion) {
        types.push(expansionMapping[locationKey]); // Use dynamic mapping based on location
    }

    types.forEach(type => {
        const upgradesOfType = locationData[type];
        if (!upgradesOfType) return;

        Object.entries(upgradesOfType).forEach(([upgradeName, currentLevel]) => {
            const upgradeDef = upgradeDefinitions[type]?.[upgradeName];
            if (!upgradeDef) return;

            for (let level = 1; level <= currentLevel; level++) {
                totalSpent += calculateNextLevelCost(level, upgradeDef.initialPrice);
            }

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
    const franchisename = userData.info.franchise;
    // Utility incomes
    const franchiseIncomeBonus = getFranchiseStatusIncomeBonus(userData.info.franchiseStatus);
    const levelIncomeBonus = getLevelIncomeBonus(userData.info.level);
    const userfranchisefound = userData.info.franchise;
    let franchiseIncome = 0;
    if (userfranchisefound !== "🏢 None") {
        const franchiseIncomefound = await db.get(`franchise_${userfranchisefound}`);
        
        // If the franchise data exists and has an income field, use it
        if (franchiseIncomefound && franchiseIncomefound.income) {
            franchiseIncome = franchiseIncomefound.income + franchiseIncomeBonus;
        }
    } else {
        // If franchise is "None", we ensure income stays at 0
        console.log("User is not part of any franchise. Setting income to 0.");
    }
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
    const leveldifference = maxLevelIncome - levelIncome;
    const currentMaxHQincome = storedCurrentIncome + hqmaxdifference; // Current income with maximum HQ benefit
    const ultrafullincome = currentMaxedIncome + hqmaxdifference + leveldifference;
    let achievedMaxIncomestring = '';
    if (glitchedIncome < 0) { 
        const achievedMaxIncome = storedCurrentIncome >= currentMaxedIncome;
        achievedMaxIncomestring = achievedMaxIncome ? 'Yes' : 'No';
    } else if (glitchedIncome > 0) {
        const achievedMaxIncome = storedCurrentIncome >= maxedIncome;
        achievedMaxIncomestring = achievedMaxIncome ? 'Yes' : 'No';
    }


    return {
        actualIncome,
        glitchedIncome,
        maxedIncome,
        currentMaxedIncome,
        fullyMaxedIncome,
        potentialCurrentIncome,
        storedCurrentIncome,
        currentMaxHQincome,
        ultrafullincome,
        levelIncome,
        franchisename,
        achievedMaxIncomestring
    };
}

async function estimateTimeToMax(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.error(`No data found for user ${userId}`);
        return null;
    }
    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];

    let Workbase = (6000+7300)/2;
    let Tipsbase = (250+2500)/2;
    const increase = 1200;
    const tipslevel = locationData.upgrades.tipjar;
    const applianceslevel = locationData.upgrades.appliances;
    const hqtips = userData.hq.info.tip;
    const hqappliances = userData.hq.info.work;
    const tips = (Tipsbase + (increase * (tipslevel+1))) + ((Tipsbase + (increase * (tipslevel+1)))*hqtips);
    const appliances = (Workbase + (increase * (applianceslevel+1))) + ((Workbase + (increase * (applianceslevel+1)))*hqappliances);
    let total = tips + appliances;


    return {
        tips,
        appliances,
        total
    }
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
function beautifyAllLocations(locations) {
    const locationMap = {
        city: "🏙 City Shack",
        amusement: "🎢 Amusement Park Shack",
        taco: "🌮 Taco Shack",
        mall: "🏬 Mall Shack",
        beach: "⛱ Beach Shack"
    };

    if (!locations || Object.keys(locations).length === 0) {
        return 'No location data available'; // Return a default message if no locations
    }

    let result = '';
    Object.keys(locations).forEach(key => {
        // Checking if each location has meaningful 'info' object and possibly other necessary checks
        if (locations[key].info && Object.keys(locations[key].info).length > 0) {
            const percentageMaxed = locations[key].info.expansionLevel ? `${locations[key].info.expansionLevel * 10}%` : 'Not Available'; // Example percentage calculation
            result += `**${locationMap[key] || key}**: ${percentageMaxed} maxed\n`;
        }
    });

    return result || 'No detailed location data available';
}

async function calculateLocationsUnlocked(userData) {
    const locations = userData.location || {};
    const unlockedLocations = Object.entries(locations)
        .filter(([key, loc]) => loc.info && loc.info.income > 0)
        .map(([key]) => beautifyLocation(key)); // beautifyLocation should format location names nicely

    return unlockedLocations.join(', ');
}

// Calculate total spent for all locations
async function calculateTotalSpent(userData) {
    let totalSpent = 0;
    const locations = Object.keys(userData.location || {});
    for (const locationKey of locations) {
        const financialData = await calculateFinancialProgress(userData.info.userid, locationKey);
        // Remove commas before converting to number
        console.log(typeof financialData.totalSpent, financialData.totalSpent);
        const cleanTotalSpent = parseInt(financialData.totalSpent.replace(/[\s,]+/g, ''), 10);
        totalSpent += cleanTotalSpent;
    }
    // Format at the end of the calculation
    return totalSpent.toLocaleString();
}

// Calculate total potential spending to max out all locations
async function calculateTotalToMax(userData) {
    let totalToMax = 0;
    const locations = Object.keys(userData.location || {});
    for (const locationKey of locations) {
        const financialData = await calculateFinancialProgress(userData.info.userid, locationKey);
        // Remove commas before converting to number
        const cleanTotalToMax = parseInt(financialData.totalToMax.replace(/[\s,]+/g, ''), 10);
        totalToMax += cleanTotalToMax;
    }
    // Format at the end of the calculation
    return totalToMax.toLocaleString();
}

function calculateTotalIncome(userData) {
    let totalIncome = 0;
    for (const locationKey in userData.location) {
        if (userData.location[locationKey].info && userData.location[locationKey].info.income) {
            totalIncome += userData.location[locationKey].info.income;
        }
    }
    return totalIncome.toLocaleString();
}


// async function calculateTotalPercentageMaxed(userData) {
//     let totalSpent = 0;
//     let totalToMax = 0;
//     const locations = Object.keys(userData.location || {});

//     for (const locationKey of locations) {
//         const financialData = await calculateFinancialProgress(userData.info.userid, locationKey);
//         totalSpent += parseInt(financialData.totalSpent.replace(/[\$,]/g, ''), 10); // Remove commas and dollar signs, then parse as integer
//         totalToMax += parseInt(financialData.totalToMax.replace(/[\$,]/g, ''), 10); // Remove commas and dollar signs, then parse as integer
//     }
//     console.log(`Total Spent is: ${totalSpent}`)
//     console.log(`Total max is: ${totalToMax}`)
//     const overallPercentageMaxed = totalToMax > 0 ? (totalSpent / totalToMax) * 100 : 0;
//     return {
//         totalSpent: totalSpent.toLocaleString(), // Format as a string with commas
//         totalToMax: totalToMax.toLocaleString(), // Format as a string with commas
//         percentageMaxed: overallPercentageMaxed.toFixed(2) // Format to two decimal places
//     };
// }

module.exports = {
    profileHandler: function (client) {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton() || interaction.customId !== 'profile') return;

            const userId = interaction.user.id;
            const userData = await db.get(`shackData.${userId}`) || {};
            const optimalUpgradesData = await calculateDynamicOptimalUpgrades(userId, null); // Using null for selectedLocation as a default
            const percentageMaxed = await calculatePercentageMaxed(userId);
            // const incomeDetails = await calculateIncomeDetails(userId);
            const timeToMax = await estimateTimeToMax(userId);
            const userfranchise = userData.info.franchise;
            const locationData = userData.location || {}; // Default to an empty object if userData.location is undefined
            const franchisedata = await db.get(`franchiseData.${userfranchise}`) || {};
            
            const beautifiedLocations = beautifyAllLocations(locationData);
            
    // Example calculations (ensure these functions exist and are imported)
    const allLocationsFormatted = beautifyAllLocations(userData.locations); // Assuming beautifyAllLocations summarizes all locations
    const beautifiedLocationData = beautifyAllLocations(userData.location);
    // const financialProgress = await calculateFinancialProgress(userId, locationKey);
    let otherLocationsReport = '';

    // Process each location for a detailed report
    if (userData.location && Object.keys(userData.location).length > 0) {
        for (let locationKey in userData.location) {
            if (locationKey !== userData.info.activeLocation) {  // Skip the active location for this loop
                // dont add location if percentage maxed is 0
                if (userData.location[locationKey].info.income > 0) {
                const financialProgress = await calculateFinancialProgress(userId, locationKey);
                otherLocationsReport += `**${beautifyLocation(locationKey)}**\n` +
                                        `Percentage Maxed: ${financialProgress.percentageMaxed}%\n`
                                        // `Total Spent: $${financialProgress.totalSpent}\n` +
                                        // `Total to Max: $${financialProgress.totalToMax}\n` +
                                        // `Total Left to Max: $${financialProgress.totalLeft}\n\n`;
            } else {
                otherLocationsReport += `**${beautifyLocation(locationKey)}**\n` +
                                        `No income data available\n\n`;
            }
        }
        }
    } else {
        otherLocationsReport = "No other location data available";
    }

    // Specific data for the active location
    const financialProgressActive = await calculateFinancialProgress(userId, userData.info.activeLocation);
    const incomeDetails = await calculateIncomeDetails(userId);
    const totalspent =await calculateTotalSpent(userData);
    const totaltomax = await calculateTotalToMax(userData);
    const parsedTotalSpent = parseInt(totalspent.replace(/\s/g, ''), 10);
    const parsedTotalToMax = parseInt(totaltomax.replace(/\s/g, ''), 10);
    const percentageMax = (parsedTotalSpent / parsedTotalToMax) * 100;
    const formattedPercentageMax = percentageMax.toFixed(2);
    const usersfranchise = userData.info.franchise;
    console.log(usersfranchise)
    const usersFranchise = userData.info.franchise;
    let franchiseIncome = 0; // Default to 0
    
    // Check if the user is part of a franchise
    if (usersFranchise !== "🏢 None") {
        const franchiseData = await db.get(`franchise_${usersFranchise}`);
        
        // If the franchise data exists and has an income field, use it
        if (franchiseData && franchiseData.income) {
            franchiseIncome = franchiseData.income;
        }
    } else {
        // If franchise is "None", we ensure income stays at 0
        console.log("User is not part of any franchise. Setting income to 0.");
    }
        const embed = new EmbedBuilder()
        .setColor('#FFB6C1')
        .setTitle(`${userData.info.username || 'User'}'s Comprehensive Profile Report`)
        .setDescription("Detailed financial and operational report for all locations.")
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields([
            {
                name: '🔎 Current Location Analysis',
                value: `**Location**: ${beautifyLocation(userData.info.activeLocation)}\n` +
                       `**Percentage Maxed**: ${financialProgressActive.percentageMaxed}%\n` +
                       `**Total Spent**: $${financialProgressActive.totalSpent}\n` +
                       `**Total to Max**: $${financialProgressActive.totalToMax}\n` +
                       `**Total Left to Max**: $${financialProgressActive.totalLeft}\n` +
                       `**Current Income**: $${incomeDetails.storedCurrentIncome}\n` +
                       `**Actual Income**: $${incomeDetails.actualIncome}\n` +
                       `**Glitched Income**: $${incomeDetails.glitchedIncome}\n` +
                       `**Maxed Income**: $${incomeDetails.currentMaxedIncome}\n` +
                       `**Achieved Max Income**: ${incomeDetails.achievedMaxIncomestring}\n`,
                inline: false
            },
            {
                name: '📝 Other Locations',
                value: `**Locations Unlocked**: ${await calculateLocationsUnlocked(userData)}\n` +
                       `**Total Spent**: $${totalspent}\n` +
                       `**Total to Max**: $${totaltomax}\n` +
                       `**Total Income**: $${calculateTotalIncome(userData)}\n` +
                       `**Total Percentage Maxed**: ${formattedPercentageMax}%\n`,
                inline: false
            },
                {
                name: '📒 Miscellaneous Data',
                value: 
                // `**Shift Income**: $${incomeDetails.shiftIncome}\n` +
                //        `**Tips Income**: $${incomeDetails.tipsIncome}\n` +
                       `**Level Income**: $${incomeDetails.levelIncome}\n` +
                       `**Franchise Income**: $${franchiseIncome}\n` +
                       `**Donator Status**: ${userData.info.donatorRank || 'None'}\n` +
                       `**HQ Income**: ${userData.hq.info.income}\n` +
                       `**Franchise Name**: ${userData.info.franchise}\n`,

                    //    `**Patreon Server**: ${actualFunction.checkIfGuildPatreon? 'yes' : 'no'}\n`,
                inline: false
            }
        ])
        .setFooter({ text: `${interaction.user.username} | ${beautifyLocation(userData.info.activeLocation || 'default')}` });
        await interaction.reply({ embeds: [embed] });
}
        );
    }
};




// Path: Cryptology2/utils/TacoShack/Profile.js
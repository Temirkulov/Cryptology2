const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const shackData = require('./shackData.json');

async function calculateCurrentUserIncome(userId) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData) {
        console.log(`No user data found for user ID ${userId}`);
        return 0;
    }
    const specialSectionMapping = {
        taco: 'truck',
        beach: 'stand',
        city: 'cart',
        amusement: 'attractions',
        mall: 'kiosk',
        // Add other mappings as needed
      };
      
    const activeLocation = userData.info.activeLocation;
    const locationUpgrades = userData.location[activeLocation].upgrades;
    const locationHire = userData.location[activeLocation].hire;
    const locationDecorations = userData.location[activeLocation].decorations;
    const locationAdvertisements = userData.location[activeLocation].advertisements;
    const specialSectionName = specialSectionMapping[activeLocation];
    const specialSection = userData.location[activeLocation][specialSectionName] || {};

    const upgradeDefinitions = shackData.locations[activeLocation];

    let totalIncome =  0; // Start with base income
    // userData.location[activeLocation].info.income ||
    // Process upgrades
    for (const upgradeType in locationUpgrades) {
        const userUpgradeLevel = locationUpgrades[upgradeType];
        const upgradeDef = upgradeDefinitions.upgrades[upgradeType];
        if (upgradeDef) {
            totalIncome += userUpgradeLevel * upgradeDef.boost;
        } else {
            console.log(`Definition not found for upgrade: ${upgradeType} in location: ${activeLocation}`);
        }
    }
    // Process decorations
    for (const decoType in locationDecorations) {
        const userDecorationsLevel = locationDecorations[decoType];
        const decoDef = upgradeDefinitions.decorations[decoType];
        if (decoDef) {
            totalIncome += userDecorationsLevel * decoDef.boost;
        } else {
            console.log(`Definition not found for upgrade: ${decoType} in location: ${activeLocation}`);
        }
    }
    // Process advertisements
    for (const adType in locationAdvertisements) {
        const userAdvertisementsLevel = locationAdvertisements[adType];
        const adDef = upgradeDefinitions.advertisements[adType];
        if (adDef) {
            totalIncome += userAdvertisementsLevel * adDef.boost;
        } else {
            console.log(`Definition not found for upgrade: ${adType} in location: ${activeLocation}`);
        }
    }



    // Process hires
    for (const hireType in locationHire) {
        const userHireLevel = locationHire[hireType];
        const hireDef = upgradeDefinitions.hire[hireType];
        if (hireDef) {
            totalIncome += userHireLevel * hireDef.boost;
        } else {
            console.log(`Definition not found for hire: ${hireType} in location: ${activeLocation}`);
        }
    }
        // Process special section
        for (const specialUpgradeType in specialSection) {
            const userUpgradeLevel = specialSection[specialUpgradeType];
            const upgradeDef = upgradeDefinitions[specialSectionName][specialUpgradeType];
            if (upgradeDef) {
                totalIncome += userUpgradeLevel * upgradeDef.boost;
            } else {
                console.log(`Definition not found for special upgrade: ${specialUpgradeType} in section: ${specialSectionName}`);
            }
        }
    

    console.log(`Total income for user ${userId} is: ${totalIncome}`);
    return totalIncome;
}
function calculateNextLevelCost(level, initialCost) {
    return (level * level) * initialCost;
}
const expansionMapping = {
    taco: 'truck',
    city: 'cart',
    beach: 'stand',
    amusement: 'attractions',
    // Add other locations as necessary
};

async function calculateOptimalUpgrades(userId) {
    const userData = await db.get(`shackData.${userId}`);
    const activeLocation = userData.info.activeLocation;
    const locationData = userData.location[activeLocation];
    const upgradeDefinitions = require('./shackData.json').locations[activeLocation];
    
    let allUpgrades = [];

    // Combine all types of upgrades into one list to simplify processing
    const types = ['upgrades', 'hire', 'decorations', 'advertisements', 'expansion'];
    types.forEach(type => {
        if (type === 'expansion') {
            // Special handling for expansion
            const expansionName = expansionMapping[activeLocation]; // Use the mapping to get the correct expansion name
            if (locationData[expansionName]) {
                const currentLevel = locationData[expansionName];
                const upgradeDef = upgradeDefinitions[expansionName]; // Adjust this based on your data structure
                const maxLevel = upgradeDef?.max || 0;
                const initialPrice = upgradeDef?.initialPrice || 0;
                const boost = upgradeDef?.boost || 0;
    
                if (currentLevel < maxLevel) {
                    const nextLevelCost = calculateNextLevelCost(currentLevel + 1, initialPrice);
                    const roi = boost / nextLevelCost;
                    allUpgrades.push({ upgradeName: expansionName, nextLevel: currentLevel + 1, nextLevelCost, boost, roi, type: 'expansion' });
                }
            }
        } else if (locationData[type]) {
            // Regular handling for other types
            Object.keys(locationData[type]).forEach(upgradeName => {
                const currentLevel = locationData[type][upgradeName];
                const maxLevel = upgradeDefinitions[type]?.[upgradeName]?.max || 0;
                const initialPrice = upgradeDefinitions[type]?.[upgradeName]?.initialPrice || 0;
                const boost = upgradeDefinitions[type]?.[upgradeName]?.boost || 0;
    
                if (currentLevel < maxLevel) {
                    const nextLevelCost = calculateNextLevelCost(currentLevel + 1, initialPrice);
                    const roi = boost / nextLevelCost;
                    allUpgrades.push({ upgradeName, nextLevel: currentLevel + 1, nextLevelCost, boost, roi, type });
                }
            });
        }
    });
    

    // Sort by ROI to find the most beneficial upgrades first
    allUpgrades.sort((a, b) => b.roi - a.roi);

    // Prioritize "tipjar" and "appliances" by ensuring they are at the front if they appear
    const priorityUpgrades = ['tipjar', 'appliances'].map(name => {
        const index = allUpgrades.findIndex(upgrade => upgrade.upgradeName === name);
        return index >= 0 ? allUpgrades.splice(index, 1)[0] : null;
    }).filter(upgrade => upgrade);

    // Combine prioritized with the rest
    const optimalUpgrades = [...priorityUpgrades, ...allUpgrades];

    return optimalUpgrades;
}

async function getRecommendedUpgradesWithPriority(userId) {
    // Calculate all optimal upgrades without considering priority
    const optimalUpgrades = await calculateOptimalUpgrades(userId);

    // Prioritize 'tipjar' and 'appliances' by moving them to the front if they are not maxed out
    const priorityUpgrades = ['tipjar', 'appliances'];
    const prioritizedUpgrades = [];

    priorityUpgrades.forEach(priority => {
        const foundIndex = optimalUpgrades.findIndex(upgrade => upgrade.upgradeName === priority);
        if (foundIndex !== -1) {
            // Remove from current position and add to the start
            const [priorityUpgrade] = optimalUpgrades.splice(foundIndex, 1);
            prioritizedUpgrades.push(priorityUpgrade);
        }
    });

    // Combine the prioritized upgrades with the rest, limiting to the next 15 upgrades
    const recommendedUpgrades = prioritizedUpgrades.concat(optimalUpgrades).slice(0, 15);

    return recommendedUpgrades;
}

// Prepare the Discord embed
async function prepareUpgradeRecommendationEmbed(userId) {
    const recommendedUpgrades = await getRecommendedUpgradesWithPriority(userId);

    // Construct the embed
    const embed = new EmbedBuilder()
        .setTitle('Optimal Upgrades Recommendation')
        .setColor(0x0099ff)
        .setDescription('Here are your recommended upgrades:');

    recommendedUpgrades.forEach(upgrade => {
        embed.addFields({
            name: `${upgrade.upgradeName} (Next level: ${upgrade.nextLevel})`,
            value: `Cost: ${upgrade.nextLevelCost.toLocaleString()} - Boost: +${upgrade.boost}/hr`
        });
    });

    return embed;
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
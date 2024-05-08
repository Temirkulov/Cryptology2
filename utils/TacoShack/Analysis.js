const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const shackData = require('./shackData.json');
const upgradeDefinitions = require('./shackData.json').locations; // Load upgrade definitions

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


async function prepareUpgradeRecommendationEmbed(userId, selectedLocation = null) {
    const userData = await db.get(`shackData.${userId}`) || {};
    // Determine the location to use for the calculation - either the selected one or the user's current active location
    if (!userData || !userData.info || (!selectedLocation && !userData.info.activeLocation)) {
        throw new Error("You need to run /setup first and react to your /shack embed before running analysis!");
    }
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
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_location')
        .setPlaceholder(beautifiedLocation)
        .addOptions(
            // new StringSelectMenuBuilder.Option('City Shack'),
            new StringSelectMenuOptionBuilder()
            .setLabel('City Shack')
            .setValue('city'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Amusement Park Shack')
            .setValue('amusement'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Taco Shack')
            .setValue('taco'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Mall Shack')
            .setValue('mall'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Beach Shack')
            .setValue('beach')
            );

    // Create the button
    const button = new ButtonBuilder()
        .setCustomId('profile')
        .setLabel('Profile')
        .setStyle(ButtonStyle.Primary);

    // Group them in an ActionRow
    const actionRowButton = new ActionRowBuilder().addComponents(button);
    const actionRowSelectMenu = new ActionRowBuilder().addComponents(selectMenu);
    
    return { embeds: [embed], components: [actionRowSelectMenu, actionRowButton] };
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
            if (interaction.isStringSelectMenu() && interaction.customId === 'select_location') {
                const userId = interaction.user.id;
                const selectedLocation = interaction.values[0];
                const { embeds, components } = await prepareUpgradeRecommendationEmbed(userId, selectedLocation);
                await interaction.update({ embeds, components });
            }

            // Handle button interaction as before
            if (interaction.isButton() && interaction.customId === 'analysis') {
                const userId = interaction.user.id;
                try {
                    const { embeds, components } = await prepareUpgradeRecommendationEmbed(userId);
                    // Additional code to handle successful preparation...
                    await interaction.reply({ embeds, components });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: error.message, ephemeral: true });
                }
        
            }
            // Handle select menu interaction
        });
    }
};

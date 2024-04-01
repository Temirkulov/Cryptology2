// Define the upgrades available and their characteristics
const upgrades = {
    // Decorations
    banner: { max: 50, boost: 5, initialPrice: 150 },
    sign: { max: 50, boost: 10, initialPrice: 500 },
    glass: { max: 45, boost: 30, initialPrice: 2500 },
    artwork: { max: 8, boost: 150, initialPrice: 100000 },
    chandelier: { max: 8, boost: 1750, initialPrice: 5000000 },
    // Food Stand
    buns: { max: 30, boost: 50, initialPrice: 7500 },
    condiments: { max: 25, boost: 100, initialPrice: 10000 },
    beverages: { max: 20, boost: 275, initialPrice: 50000 },
    coolers: { max: 15, boost: 450, initialPrice: 250000 },
    grill: { max: 10, boost: 800, initialPrice: 1000000 },
    // Shack Upgrades
    paint: { max: 45, boost: 10, initialPrice: 250 },
    furniture: { max: 40, boost: 20, initialPrice: 600 },
    appliances: { max: 30, boost: 0, initialPrice: 1200 }, // Assuming work money boost is $100 for simplification
    bathrooms: { max: 40, boost: 25, initialPrice: 800 },
    billboard: { max: 40, boost: 35, initialPrice: 1000 },
    tipjar: { max: 35, boost: 0, initialPrice: 500 }, // Assuming tips collected boost is $50 for simplification
    // Employees
    apprentice: { max: 45, boost: 10, initialPrice: 250 },
    cook: { max: 45, boost: 20, initialPrice: 600 },
    advertiser: { max: 45, boost: 20, initialPrice: 700 },
    greeter: { max: 45, boost: 25, initialPrice: 800 },
    sous: { max: 45, boost: 40, initialPrice: 1200 },
    head: { max: 40, boost: 65, initialPrice: 2000 },
    executive: { max: 45, boost: 150, initialPrice: 5000 },
    // Advertisements
    newspaper: { max: 45, boost: 10, initialPrice: 350 },
    radio: { max: 40, boost: 20, initialPrice: 650 },
    email: { max: 40, boost: 30, initialPrice: 1000 },
    internet: { max: 45, boost: 50, initialPrice: 2000 },
    tv: { max: 30, boost: 160, initialPrice: 5500 },
    blimp: { max: 5, boost: 200, initialPrice: 250000 },
  };
  
  // Define the current levels of upgrades that have been purchased
  const currentUpgrades = {
    paint: 31,
    furniture: 28,
    bathrooms: 27,
    billboard: 29,
    appliances: 31,
    tipjar: 36, // Note: Current level exceeds max defined in upgrades; adjust as needed
    apprentice: 31,
    cook: 28,
    advertiser: 26,
    greeter: 27,
    sous: 28,
    head: 28,
    executive: 27,
    banner: 28,
    sign: 22,
    glass: 17,
    artwork: 3,
    chandelier: 1,
    newspaper: 26,
    radio: 27,
    email: 27,
    internet: 25,
    tv: 26,
    blimp: 2,
    buns: 12,
    condiments: 16,
    beverages: 11,
    coolers: 6,
    grill: 4
  };
  
function calculatePrice(level, initialPrice) {
    return (level * level) * initialPrice;
}

function calculateROI(upgradeDetails, currentLevel) {
    const price = calculatePrice(currentLevel + 1, upgradeDetails.initialPrice);
    return upgradeDetails.boost / price;
}

function findOptimalUpgrades(upgrades, currentUpgrades, numUpgrades = 25) {
    let optimalUpgrades = [];
    let tempCurrentUpgrades = { ...currentUpgrades };

    for (let i = 0; i < numUpgrades; i++) {
        let bestROI = 0;
        let bestUpgrade = null;

        for (const [upgradeName, upgradeDetails] of Object.entries(upgrades)) {
            const currentLevel = tempCurrentUpgrades[upgradeName] || 0;
            if (currentLevel < upgradeDetails.max) {
                const roi = calculateROI(upgradeDetails, currentLevel);
                if (roi > bestROI) {
                    bestROI = roi;
                    bestUpgrade = { 
                        name: upgradeName, 
                        level: currentLevel + 1, 
                        price: calculatePrice(currentLevel + 1, upgradeDetails.initialPrice),
                        roi: roi
                    };
                }
            }
        }

        if (!bestUpgrade) break; // No further upgrades are optimal or possible

        optimalUpgrades.push(bestUpgrade);
        tempCurrentUpgrades[bestUpgrade.name] = bestUpgrade.level; // Update level for next iteration
    }

    return optimalUpgrades;
}

const nextBestUpgrades = findOptimalUpgrades(upgrades, currentUpgrades, 10);
console.log(nextBestUpgrades);
// Assuming upgrades and currentUpgrades are defined as in previous examples

function calculatePrice(level, initialPrice) {
    return (level ** 2) * initialPrice;
}

let totalCostToMax = 0;
let totalSpent = 0;
let totalBoost = 0;
let currentBoost = 0;

Object.entries(upgrades).forEach(([name, {initialPrice, max, boost}]) => {
    for (let level = 0; level <= max; level++) {
        const price = calculatePrice(level, initialPrice);
        totalCostToMax += price;
        if (level <= currentUpgrades[name]) {
            totalSpent += price;
            currentBoost += boost;
        }
    }
    totalBoost += boost * max;
});

const progressPercentage = ((totalSpent / totalCostToMax) * 100).toFixed(2);
const remainingBoost = totalBoost - currentBoost;

console.log(`Total cost to max all upgrades: $${totalCostToMax.toLocaleString()}`);
console.log(`Total money spent: $${totalSpent.toLocaleString()}`);
console.log(`Overall progress: ${progressPercentage}%`);
console.log(`Total boost: +${totalBoost}/hr`);
console.log(`Current boost: +${currentBoost}/hr`);
console.log(`Remaining boost to max: +${remainingBoost}/hr`);

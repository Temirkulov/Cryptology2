const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
       
       async function minPointsForMultiplier(desiredMultiplier, upgrades, initialCosts) {
        // Function to calculate the cost-effectiveness of an upgrade
        const calculateEffectiveness = (multiplier, cost) => -multiplier / cost;
    
        // Initializing the array to hold upgrade options
        let options = upgrades.map((multiplier, index) => ({
            effectiveness: calculateEffectiveness(multiplier, initialCosts[index]),
            cost: initialCosts[index],
            multiplier: multiplier,
            index: index
        }));
    
        // Sorting options by cost-effectiveness
        options.sort((a, b) => b.effectiveness - a.effectiveness);
    
        let totalMultiplier = 1.0;
        let totalCost = 0;
        let purchases = new Array(upgrades.length).fill(0);
    
        // While loop to keep purchasing upgrades until the desired multiplier is reached
        while (totalMultiplier < desiredMultiplier) {
            for (let i = 0; i < options.length; i++) {
                if (totalMultiplier >= desiredMultiplier) break;
                let option = options[i];
                // Update total cost and multiplier
                totalCost += option.cost;
                totalMultiplier *= (1 + option.multiplier);
                purchases[option.index] += 1;
                // Update the cost of the purchased upgrade
                option.cost += initialCosts[option.index];
                // Re-calculate its cost-effectiveness
                option.effectiveness = calculateEffectiveness(option.multiplier, option.cost);
            }
            // Re-sort options after updating their cost-effectiveness
            options.sort((a, b) => b.effectiveness - a.effectiveness);
        }
    
        return { totalCost, purchases };
    }

    function calculateWithCaps(upgrades, availablePoints) {
      let totalMultiplier = 1.0; // Starting base multiplier
      let businessCap = 1000.95; // Initial business cap
      let capCost = 1000000; // Cost for a business cap
      let capsPurchased = 0; // Track number of business caps purchased
      let points = availablePoints;
  
      // Enhance upgrades with purchase tracking and reset cost to initial cost
      upgrades.forEach(upgrade => {
          upgrade.purchased = 0;
          upgrade.currentCost = upgrade.cost;
      });
  
      while (points > 0) {
          let upgradeMade = false;
  
          // Attempt to purchase upgrades if it does not cause totalMultiplier to exceed businessCap
          // or if we can afford a business cap immediately after
          upgrades.sort((a, b) => (b.multiplier / b.currentCost) - (a.multiplier / a.currentCost));
  
          for (const upgrade of upgrades) {
              const canAffordCap = (totalMultiplier + upgrade.multiplier > businessCap) && (points - upgrade.currentCost >= capCost);
              const withinCap = totalMultiplier + upgrade.multiplier <= businessCap;
              if (points >= upgrade.currentCost && (withinCap || canAffordCap)) {
                  totalMultiplier += upgrade.multiplier;
                  points -= upgrade.currentCost;
                  upgrade.purchased++;
                  upgrade.currentCost += upgrade.cost; // Increase cost for next purchase
                  upgradeMade = true;
                  if (canAffordCap) {
                      // Buy a business cap if we're going to exceed the business cap with this upgrade
                      businessCap += 500; // Increase business cap
                      points -= capCost; // Deduct cost of cap from available points
                      capCost *= 2.5; // Increase cost for next cap
                      capsPurchased++;
                  }
                  break; // Break to reassess which upgrade to purchase next
              }
          }
  
          if (!upgradeMade) break; // No upgrades made, exit loop
      }
  
      // Prepare the output for each upgrade purchased
      const purchases = upgrades.filter(u => u.purchased > 0)
                                .sort((a, b) => a.multiplier - b.multiplier) // Sort by multiplier in ascending for clarity
                                .map(u => `${u.name}: ${u.purchased} times`);
  
      return {
          purchases,
          businessCapsPurchased: capsPurchased,
          finalTotalMultiplier: totalMultiplier.toFixed(2),
          remainingPoints: points.toFixed(2)
      };
  }
  
  
  
  
  const upgrades = [
    { name: "5% Multiplier", cost: 10, multiplier: 0.05, initialCost: 10 },
    { name: "15% Multiplier", cost: 50, multiplier: 0.15, initialCost: 50 },
    { name: "30% Multiplier", cost: 250, multiplier: 0.3, initialCost: 250 },
    { name: "50% Multiplier", cost: 750, multiplier: 0.5, initialCost: 750 },
    { name: "100% Multiplier", cost: 2500, multiplier: 1.0, initialCost: 2500 },
];

  
  function calculateBusinessCapsCost(targetMultiplier, initialCap = 1000.95, capIncrease = 500, baseCapCost = 1000000, capIncreaseFactor = 2.5) {
    let capsNeeded = 0;
    let totalCapCost = 0;
    let currentCapCost = baseCapCost;

    // Adjust the calculation for caps needed based on the cap increase per business cap
    if (targetMultiplier > initialCap) {
        capsNeeded = Math.ceil((targetMultiplier - initialCap) / capIncrease);
        
        // Calculate the total cost for all needed business caps
        for (let i = 0; i < capsNeeded; i++) {
            totalCapCost += currentCapCost;
            currentCapCost *= capIncreaseFactor; // Increase the cost for the next cap
        }
    }

    return {
        capsNeeded,
        totalCapCost
    };
}



  module.exports = {

    
    data: new SlashCommandBuilder()
        .setName('pcalc')
        .setDescription('Calculate prestige or multiplier.')
        .addStringOption(option =>
            option.setName('operation')
                .setDescription('Select operation')
                .setRequired(true)
                .addChoices(
                    { name: 'Prestige Points', value: 'estimate_prestige' },
                    { name: 'Multiplier', value: 'estimate_multi' }
                ))
        .addIntegerOption(option =>
            option.setName('input')
                .setDescription('Input value for the selected operation')
                .setRequired(true)),
        // .addStringOption(option =>
        //           option.setName('with_caps')
        //               .setDescription('Select with or without multiplier caps')
        //               .setRequired(false)
        //               .addChoices(
        //                   { name: 'With Caps', value: 'withcaps' },
        //                   { name: 'Without Caps', value: 'withoutcaps' }
        //               )),      
        
    async execute(interaction) {
        const operation = interaction.options.getString('operation');
        const input = interaction.options.getInteger('input');
        let description = '';

        if (operation === 'estimate_prestige') {
          const availablePoints = input;
          const result = calculateWithCaps(upgrades, availablePoints);
          description = ("Selected Upgrades:\n", result.purchases.join("\n"));
          description += (`\nBusiness Caps Purchased: ${result.businessCapsPurchased}`);
          description += (`\nFinal Total Multiplier: ${result.finalTotalMultiplier}`);
          description += (`\nRemaining Points: ${result.remainingPoints}`);
          

              

        } else if (operation === 'estimate_multi') {
            function minPointsForAdditiveMultiplier(targetAddedMultiplier, upgrades, initialCosts) {
                let totalAddedMultiplier = 0.0;
                let totalCost = 0;
                let purchases = new Array(upgrades.length).fill(0);
                let currentCosts = [...initialCosts];
            
                while (totalAddedMultiplier < targetAddedMultiplier) {
                    // Calculate cost-effectiveness for each upgrade
                    let effectiveness = upgrades.map((upgrade, index) => upgrade / currentCosts[index]);
                    // Find the index of the most cost-effective upgrade
                    let bestUpgradeIndex = effectiveness.indexOf(Math.max(...effectiveness));
                    // Update total cost, purchases, and the total added multiplier
                    totalCost += currentCosts[bestUpgradeIndex];
                    totalAddedMultiplier += upgrades[bestUpgradeIndex];
                    purchases[bestUpgradeIndex]++;
                    // Increase the cost for the next purchase of this upgrade
                    currentCosts[bestUpgradeIndex] += initialCosts[bestUpgradeIndex];
            
                    if (totalAddedMultiplier >= targetAddedMultiplier) {
                        break;
                    }
                }
            
                return { totalCost, purchases };
            }
            const targetMultiplier = input; // Example target multiplier
            const { capsNeeded, totalCapCost } = calculateBusinessCapsCost(targetMultiplier);
            console.log(`Business Caps Needed: ${capsNeeded}`);
            console.log(`Total Business Caps Cost: ${totalCapCost}`);
            

            // Example usage
            const targetAddedMultiplier = input;  // Since we start from 1, we need to add 19 to reach 20
            const upgrades = [0.05, 0.15, 0.3, 0.5, 1.00];
            const initialCosts = [10, 50, 250, 750, 2500];
            
            const result = minPointsForAdditiveMultiplier(targetAddedMultiplier, upgrades, initialCosts);
            console.log(`Minimum points required: ${result.totalCost + totalCapCost}`);
            console.log(`Purchases: ${result.purchases.join(', ')}`);
            description = `**Desired Multiplier: ${input}x**\nMinimum points required: **${(result.totalCost + totalCapCost).toLocaleString('en-US', { minimumFractionDigits: 0 }) }**\n\n`
            // Append each upgrade purchase count to the description
            upgrades.forEach((upgrade, index) => {
            description += `**${upgrade * 100}% Multiplier:** ${result.purchases[index]}\n`;
            });
            description += `** Total Multiplier: ${input}x**\n** Multiplier Caps: ${capsNeeded}**\n**Total Multiplier Caps Cost: ${totalCapCost.toLocaleString('en-US', { minimumFractionDigits: 0 }) }**\n`;
          }
          // } else if(operation ===`estimate_multi` && interaction.options.getString('with_caps') === 'withoutcaps') {
          //   function minPointsForAdditiveMultiplier(targetAddedMultiplier, upgrades, initialCosts) {
          //     let totalAddedMultiplier = 0.0;
          //     let totalCost = 0;
          //     let purchases = new Array(upgrades.length).fill(0);
          //     let currentCosts = [...initialCosts];
            
          //     while (totalAddedMultiplier < targetAddedMultiplier) {
          //         // Calculate cost-effectiveness for each upgrade
          //         let effectiveness = upgrades.map((upgrade, index) => upgrade / currentCosts[index]);
          //         // Find the index of the most cost-effective upgrade
          //         let bestUpgradeIndex = effectiveness.indexOf(Math.max(...effectiveness));
          //         // Update total cost, purchases, and the total added multiplier
          //         totalCost += currentCosts[bestUpgradeIndex];
          //         totalAddedMultiplier += upgrades[bestUpgradeIndex];
          //         purchases[bestUpgradeIndex]++;
          //         // Increase the cost for the next purchase of this upgrade
          //         currentCosts[bestUpgradeIndex] += initialCosts[bestUpgradeIndex];
            
          //         if (totalAddedMultiplier >= targetAddedMultiplier) {
          //             break;
          //         }
          //     }
            
          //     return { totalCost, purchases };
          //   }
            
            
          //   const targetMultiplier = input; // Example target multiplier
          //   const upgrades = [0.05, 0.15, 0.3, 0.5, 1.00];
          //   const initialCosts = [10, 50, 250, 750, 2500];
          //   const result = minPointsForAdditiveMultiplier(targetMultiplier, upgrades, initialCosts);
          //   let description = `**Desired Multiplier: ${input}x**\nMinimum points required: ${result.totalCost}\n`;
          //   upgrades.forEach((upgrade, index) => {
          //     description += `${upgrade * 100}% = ${result.purchases[index]} purchases\n`;
          // });
          //   }
          
        const responseEmbed = new EmbedBuilder()
        .setTitle("Calculation Result")
        .setColor('#32CD32')
        .setDescription(description)
        .setTimestamp();

        await interaction.reply({ embeds: [responseEmbed] });
    }

}
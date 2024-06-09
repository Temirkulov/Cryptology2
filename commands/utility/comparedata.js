const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const donatorPacks = require('../../utils/TacoShack/donatorPacks.json');

async function calculateIncome(userId, guildId) {
    try {
        // Get user data
        const userData = await db.get(`shackData.${userId}`);
        if (!userData) {
            throw new Error('User data not found');
        }

        // Extract donator rank and settings
        const donatorRank = userData.info.donatorRank || 'None';
        const donatorSettings = donatorPacks[donatorRank];

        // Get server patreon settings
        const serverPatreonSettings = await db.get(`patreonPerks_${guildId}`) || {
            workMultiplier: 1,
            tipsMultiplier: 1,
            workCooldown: 0,
            tipCooldown: 0,
            description: "No Patreon perks are active."
        };

        // Base values for Gordon Ramsey
        const baseWorkGordon = (6000 + 7300) / 2; // 6650
        const baseTipsGordon = (250 + 2500) / 2; // 1375

        // Adjust base values to 1x by dividing by Gordon Ramsey's multiplier (3)
        const baseWork1x = baseWorkGordon / 6; // 2216.67
        const baseTips1x = baseTipsGordon / 6; // 458.33
        const baseOvertime = baseWork1x * 2;

        // Use increase per level
        const increasePerLevel = 400;
        const rankMultiplier = donatorSettings.workMultiplier;

        // Effective multipliers from donator rank and server settings
        const effectiveWorkMultiplier = donatorSettings.workMultiplier * (serverPatreonSettings.workMultiplier || 1);
        const effectiveTipsMultiplier = donatorSettings.tipsMultiplier * (serverPatreonSettings.tipsMultiplier || 1);

        // HQ bonuses
        const hqBonuses = userData.hq.upgrades || {};
        const tipsHQBonus = (hqBonuses.customerservicedepartment || 0) * 0.04; // 4% per level
        const workHQBonus = (hqBonuses.foodservicesdepartment || 0) * 0.04; // 4% per level
        const overtimeHQBonus = (hqBonuses.overtimemanagement || 0) * 1; // 100% per level
        console.log(`overtime bonus ${overtimeHQBonus}`)
        // Loop through each location to calculate total earnings
        const locations = userData.location || {};
        let totalWorkEarnings = 0;
        let totalTipsEarnings = 0;
        let totalOvertimeEarnings = 0;
        console.log("Starting income calculations...");
        for (const locationKey of Object.keys(locations)) {
            console.log(`Processing location: ${locationKey}`);
            const location = locations[locationKey];
            const appliancesLevel = (location.upgrades.appliances || 0);
            const tipjarLevel = (location.upgrades.tipjar || 0) ;
            // Log initial values
            // console.log(`Initial values for location ${locationKey}:`);
            // console.log(`- baseWork1x: ${baseWork1x}`);
            // console.log(`- appliancesLevel: ${appliancesLevel}`);
            // console.log(`- baseTips1x: ${baseTips1x}`);
            // console.log(`- tipjarLevel: ${tipjarLevel}`);
            // console.log(`- increasePerLevel: ${increasePerLevel}`);
            // console.log(`- rankMultiplier: ${rankMultiplier}`);
            // console.log(`- workHQBonus: ${workHQBonus}`);
            // console.log(`- tipsHQBonus: ${tipsHQBonus}`);
            // console.log(`- effectiveWorkMultiplier: ${effectiveWorkMultiplier}`);
            // console.log(`- effectiveTipsMultiplier: ${effectiveTipsMultiplier}`);

            // console.log (`base work ${baseWork1x*rankMultiplier* serverPatreonSettings.workMultiplier} appliances level ${appliancesLevel} `)
            // console.log (`base tips ${baseTips1x*rankMultiplier* serverPatreonSettings.tipsMultiplier} tipjar level ${tipjarLevel} `)
            // console.log(`appliances levelincome ${(appliancesLevel * (increasePerLevel * rankMultiplier))}`)
            // Calculate earnings for each location
            const workEarnings = (((baseWork1x*rankMultiplier * serverPatreonSettings.workMultiplier)  + (appliancesLevel * (increasePerLevel * rankMultiplier)))) * (1 + workHQBonus);
            // console.log(`work Flow: for location ${locationKey} + work earning without hq ${workEarning }`);
            // console.log(`work Flow: for location ${locationKey} + work earning ${workEarnings}`);
            const tipsEarnings = (((baseTips1x*rankMultiplier* serverPatreonSettings.tipsMultiplier) + (tipjarLevel * (increasePerLevel * rankMultiplier)))) * (1 + tipsHQBonus);
            const overtimeEarnings = (((baseWork1x*2 + (increasePerLevel * (appliancesLevel+1))*1.5 )) * (overtimeHQBonus));
            // console.log(`tips Flow: for location ${locationKey} + tips earning ${tipsEarnings}`);
            // Log calculated earnings before adding to total
            // console.log(`Calculated earnings for location ${locationKey}:`);
            // console.log(`- workEarnings: ${workEarnings}`);
            // console.log(`- tipsEarnings: ${tipsEarnings}`);

            totalWorkEarnings += workEarnings;
            totalTipsEarnings += tipsEarnings;
            totalOvertimeEarnings += overtimeEarnings;
            // console.log(`Accumulated earnings so far:`);
            // console.log(`- totalWorkEarnings: ${totalWorkEarnings}`);
            // console.log(`- totalTipsEarnings: ${totalTipsEarnings}`);
        }

        // Calculate overtime earnings based on base overtime earnings
        // const baseOvertimeEarnings = baseWork1x * 1.5;

        console.log(`Final calculations:`);
        console.log(`- totalWorkEarnings: ${totalWorkEarnings}`);
        console.log(`- totalTipsEarnings: ${totalTipsEarnings}`);
        console.log(`- totalOvertimeEarnings: ${totalOvertimeEarnings}`);

        return {
            totalWorkEarnings,
            totalTipsEarnings,
            totalOvertimeEarnings
        };
    } catch (error) {
        console.error('Error calculating income:', error);
        return {
            totalWorkEarnings: 0,
            totalTipsEarnings: 0,
            totalOvertimeEarnings: 0
        };
    }
}
async function calculateEfficiency(userId, guildId, snapshot1, snapshot2) {
    try {
        const userData = await db.get(`shackData.${userId}`);
        if (!userData) throw new Error('User data not found');

        const donatorRank = userData.info.donatorRank || 'None';
        const donatorSettings = donatorPacks[donatorRank];
        const serverPatreonSettings = await db.get(`patreonPerks_${guildId}`) || {
            workMultiplier: 1,
            tipsMultiplier: 1,
            workCooldown: 600,
            tipCooldown: 300,
            description: "No Patreon perks are active."
        };

        const workCooldown = donatorSettings.workCooldown - serverPatreonSettings.workCooldown;
        console.log(`Work cooldown: ${workCooldown}`);
        const tipCooldown = donatorSettings.tipCooldown - serverPatreonSettings.tipCooldown;
        console.log(`Tip cooldown: ${tipCooldown}`);
        const workCooldownMins = workCooldown / 60;
        const tipCooldownMins = tipCooldown / 60;
        const timeDifference = new Date(snapshot2.timestamp) - new Date(snapshot1.timestamp);
        const totalMinutes = Math.floor(timeDifference / (1000 * 60));
        console.log(`Total minutes: ${totalMinutes}`);
        const maxShifts = Math.floor(totalMinutes / workCooldownMins);
        console.log(`Max shifts: ${maxShifts}`);
        const maxTips = Math.floor(totalMinutes / tipCooldownMins);
        console.log(`Max tips: ${maxTips}`);

        const actualShifts = safeAccess(snapshot2, 'shiftsworked') - safeAccess(snapshot1, 'shiftsworked');
        console.log(`Actual shifts: ${actualShifts}`);
        const actualTips = safeAccess(snapshot2, 'tipscollected') - safeAccess(snapshot1, 'tipscollected');
        console.log(`Actual tips: ${actualTips}`);

        const shiftEfficiency = (actualShifts / maxShifts) * 100;
        console.log(`Shift efficiency: ${shiftEfficiency}`);
        const tipsEfficiency = (actualTips / maxTips) * 100;
        console.log(`Tips efficiency: ${tipsEfficiency}`);
        const avgShiftsPerDay = actualShifts / (totalMinutes / (60 * 24));

        return {
            shiftEfficiency: isFinite(shiftEfficiency) ? shiftEfficiency : 0,
            tipsEfficiency: isFinite(tipsEfficiency) ? tipsEfficiency : 0,
            avgShiftsPerDay: isFinite(avgShiftsPerDay) ? avgShiftsPerDay : 0
        };
    } catch (error) {
        console.error('Error calculating efficiency:', error);
        return {
            shiftEfficiency: 0,
            tipsEfficiency: 0,
            avgShiftsPerDay: 0
        };
    }
}

function safeAccess(obj, key) {
    const value = obj?.data[key];
    return value !== undefined ? value : 0;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('comparedata')
        .setDescription('Compare data between two snapshots.')
        .addStringOption(option =>
            option.setName('id1')
                .setDescription('First snapshot ID (newer)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('id2')
                .setDescription('Second snapshot ID (older)')
                .setRequired(true)),
    async execute(interaction) {
        const id1 = interaction.options.getString('id1').trim();
        const id2 = interaction.options.getString('id2').trim();
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        // Validate IDs: Ensure they are 5 characters long and alphanumeric
        const idRegex = /^[a-zA-Z0-9]{5}$/;
        if (!idRegex.test(id1) || !idRegex.test(id2)) {
            await interaction.reply({ content: 'Error: Each ID must be a 5-character alphanumeric string.', ephemeral: true });
            return;
        }

        try {
            // Retrieve user snapshots from the database
            const userStats = await db.get(`shackData.${userId}.stats`);
            if (!userStats || userStats.length === 0) {
                await interaction.reply({ content: 'Error: No snapshots found for your account.', ephemeral: true });
                return;
            }

            // Find the snapshots by ID
            let snapshot1 = userStats.find(snapshot => snapshot.id === id1);
            let snapshot2 = userStats.find(snapshot => snapshot.id === id2);

            // Check if both snapshots exist
            if (!snapshot1 || !snapshot2) {
                await interaction.reply({ content: 'Error: One or both snapshot IDs do not exist.', ephemeral: true });
                return;
            }

            // Ensure snapshot1 is older and snapshot2 is newer
            if (new Date(snapshot1.timestamp) > new Date(snapshot2.timestamp)) {
                [snapshot1, snapshot2] = [snapshot2, snapshot1];
            }

            // Function to safely access nested properties and handle undefined values
            const safeAccess = (obj, key) => {
                const value = obj?.data[key];
                return value !== undefined ? value : 0;
            };

            // Calculate time difference
            const timeDifference = new Date(snapshot2.timestamp) - new Date(snapshot1.timestamp);

            // Convert time difference to days, hours, and minutes
            const diffInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const diffInHours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffInMinutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

            // Function to calculate positive difference
            const calculateDifference = (newer, older) => {
                return newer - older;
            };

            // Extract and calculate differences for Grinding Stats
            const shiftsChange = calculateDifference(safeAccess(snapshot2, 'shiftsworked'), safeAccess(snapshot1, 'shiftsworked'));
            const tipsChange = calculateDifference(safeAccess(snapshot2, 'tipscollected'), safeAccess(snapshot1, 'tipscollected'));
            const overtimeChange = calculateDifference(safeAccess(snapshot2, 'overtimes'), safeAccess(snapshot1, 'overtimes'));

            // Extract and calculate differences for Gambling Stats
            const totalGamblesChange = calculateDifference(safeAccess(snapshot2, 'totalgambles'), safeAccess(snapshot1, 'totalgambles'));
            const gamblingWinningsChange = calculateDifference(safeAccess(snapshot2, 'gamblingwinnings'), safeAccess(snapshot1, 'gamblingwinnings'));
            const gamblingLossesChange = calculateDifference(safeAccess(snapshot2, 'gamblinglosses'), safeAccess(snapshot1, 'gamblinglosses'));

            // Extract and calculate differences for Miscellaneous Stats
            const dailyGiftsChange = calculateDifference(safeAccess(snapshot2, 'dailygiftscollected'), safeAccess(snapshot1, 'dailygiftscollected'));
            const totalVotesChange = calculateDifference(safeAccess(snapshot2, 'totalvotes'), safeAccess(snapshot1, 'totalvotes'));
            const tasksChange = calculateDifference(safeAccess(snapshot2, 'taskscompleted'), safeAccess(snapshot1, 'taskscompleted'));
            const franchiseChange = calculateDifference(safeAccess(snapshot2, 'franchisedonations'), safeAccess(snapshot1, 'franchisedonations'));
            const giftsSentChange = calculateDifference(safeAccess(snapshot2, 'giftssent'), safeAccess(snapshot1, 'giftssent'));
            const giftsReceivedChange = calculateDifference(safeAccess(snapshot2, 'giftsreceived'), safeAccess(snapshot1, 'giftsreceived'));

            // Calculate earnings based on changes
            const incomestats = await calculateIncome(userId, guildId);
            const workEarningsMade = shiftsChange * incomestats.totalWorkEarnings;
            const tipsEarningsMade = tipsChange * incomestats.totalTipsEarnings;
            const overtimeEarningsMade = overtimeChange * incomestats.totalOvertimeEarnings;
            const totalEarningsMade = workEarningsMade + tipsEarningsMade + overtimeEarningsMade;

            const formatNumber = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            // Calculate efficiency stats
            const efficiencyStats = await calculateEfficiency(userId, guildId, snapshot1, snapshot2);

            // Generate comparison embed with calculated differences
            const compareEmbed = new EmbedBuilder()
                .setTitle("StatSaver Comparison")
                .setAuthor( {name: `Stats: ${id1} vs ${id2}`, iconURL: `https://media.discordapp.net/attachments/776985762499002408/1249107529481453629/cryptology2.png?ex=6666198a&is=6664c80a&hm=dc310175efba894a4bfe9f889b62ca1cc0ffe24297cc993073134a67597c1f03&=&format=webp&quality=lossless&width=700&height=700`})
                .setDescription(`Time Difference: \`${diffInDays}\` Days \`${diffInHours}\` Hrs \`${diffInMinutes}\` Mins`)
                .addFields(
                    {
                        name: '<a:sickle:802757415933968404> __Grinding Stats__',
                        value: `👨‍🍳 **Shifts Change:** ${shiftsChange.toLocaleString()}\n` +
                               `👛 **Tips Change:** ${tipsChange.toLocaleString()}\n` +
                               `⌛ **Overtime Change:** ${overtimeChange.toLocaleString()}\n`,
                        inline: false
                    },
                    {
                        name: '<a:firemoney:1249109287788220428> __Earning Stats__',
                        value: `💰 **Shifts Earnings:** $${formatNumber(workEarningsMade)}\n` +
                                 `💸 **Tips Earnings:** $${formatNumber(tipsEarningsMade)}\n` +
                                 `:chart: **Overtime Earnings:** $${formatNumber(overtimeEarningsMade)}\n` +
                                 `<a:money:1249109315240071259> **Total Earnings:** $${formatNumber(totalEarningsMade)}\n`,
                        inline: false
                    },
                    {
                        name: '📈 __Efficiency Stats__',
                        value: `<a:ecafe_Working1:1249124191094046804> **Shift Efficiency:** ${formatNumber(efficiencyStats.shiftEfficiency)}%\n` +
                               `<:tipsfedora:1249124206814171258> **Tips Efficiency:** ${formatNumber(efficiencyStats.tipsEfficiency)}%\n` +
                               `👨‍💼 **Avg Shifts/Day:** ${formatNumber(efficiencyStats.avgShiftsPerDay)}`,
                        inline: false
                    },
                    {
                        name: '<a:gift:1249123794602299392> __Gambling Stats__',
                        value: `🎲 **Total Gambles:** ${formatNumber(totalGamblesChange)}\n` +
                                 `💎 **Gambling Winnings:** $${formatNumber(gamblingWinningsChange)}\n` +
                                 `📉 **Gambling Losses:** $${formatNumber(gamblingLossesChange)}`,
                        inline: false
                    },
                    {
                        name: '__Other Stats__',
                        value: `🕓 **Daily Gifts:** ${dailyGiftsChange.toLocaleString()}\n` +
                               `📩 **Total Votes:** ${totalVotesChange.toLocaleString()}\n` +
                               `🗒️ **Tasks Completed:** ${tasksChange.toLocaleString()}\n` +
                               `💵 **Franchise Donations:** $${formatNumber(franchiseChange)}\n` +
                               `🎁 **Gifts Sent:** ${giftsSentChange.toLocaleString()}\n` +
                               `📥 **Gifts Received:** ${giftsReceivedChange.toLocaleString()}`,
                        inline: false
                    }
                )
                .setColor('#FEFFA3');

            await interaction.reply({ embeds: [compareEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error comparing snapshots:', error);
            await interaction.reply({ content: 'An error occurred while comparing snapshots. Please try again later.', ephemeral: false });
        }
    }
};

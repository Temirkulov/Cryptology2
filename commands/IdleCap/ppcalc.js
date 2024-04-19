const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ppcalc')
        .setDescription('Calculates the amount needed for a given number of Prestige Points based on prestige level.')
        .addStringOption(option => 
            option.setName('prestigelevel')
                .setDescription('Prestige Level')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('prestigepoints')
                .setDescription('Prestige Points')
                .setRequired(true)),
    async execute(interaction) {
        // Retrieve the inputs from the command
        const prestigeLevelStr = interaction.options.getString('prestigelevel').replace(/,/g, '');
        const prestigePointsStr = interaction.options.getString('prestigepoints').replace(/,/g, '');

        // Convert inputs to BigInt
        const prestigeLevel = BigInt(prestigeLevelStr);
        const prestigePoints = BigInt(prestigePointsStr);

        // Calculate the cost for one Prestige Point based on the prestige level
        const onePPPCost = (2000n * prestigeLevel ** 3n) + (10000n * prestigeLevel ** 2n);

        // Calculate the total amount needed for the given Prestige Points
        const totalAmountNeeded = onePPPCost * prestigePoints;

        // Reply with the result
        await interaction.reply(`To achieve ${prestigePoints.toString()} Prestige Points at prestige level ${prestigeLevel.toString()}, you need a total amount of $${totalAmountNeeded.toString()}.`);
    },
};

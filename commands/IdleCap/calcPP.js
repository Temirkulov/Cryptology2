const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Calculates PPP based on prestige level and amount.')
        .addSubcommand(subcommand =>
            subcommand.setName('pp')
                .setDescription('Calculate Prestige Points (PPP)')
                .addStringOption(option => option.setName('prestigelevel').setDescription('Prestige Level').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Balance Amount').setRequired(true))),
    async execute(interaction) {
        // Retrieve the inputs from the command as strings
        const prestigeLevelStr = interaction.options.getString('prestigelevel');
        const amountStr = interaction.options.getString('amount');

        // Convert inputs to BigInt
        const prestigeLevel = BigInt(prestigeLevelStr);
        const amount = BigInt(amountStr);

        // Perform the calculation using BigInt arithmetic
        const onePPPCost = (2000n * prestigeLevel ** 3n) + (10000n * prestigeLevel ** 2n);
        const PPP = amount / onePPPCost;

        // Reply with the result, converting BigInt back to string for display
        await interaction.reply(`Prestige Level: ${prestigeLevel.toString()}\nAmount: $${amount.toString()}\nPrestige Points: ${PPP.toString()}`);
    },
};


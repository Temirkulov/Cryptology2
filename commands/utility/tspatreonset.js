const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tspatreonset')
        .setDescription('Sets the Patreon perks for the server based on the tier selected.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), // Ensure only users with Manage Guild permissions can use it

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('select_patreon_tier')
                    .setPlaceholder('Select the Patreon tier for your server')
                    .addOptions([
                        {
                            label: 'None',
                            description: 'Select no Patreon perks.',
                            value: 'none'
                        },
                        {
                            label: '3 Star Restaurant',
                            description: 'Select 3 Star Restaurant perks.',
                            value: 'three_star_restaurant'
                        },
                        {
                            label: '5 Star Restaurant',
                            description: 'Select 5 Star Restaurant perks.',
                            value: 'five_star_restaurant'
                        }
                    ]),
            );

        await interaction.reply({ content: 'Please select the Patreon tier you want to apply:', components: [row], ephemeral: true });

        // Listener for the select menu
        const filter = i => i.customId === 'select_patreon_tier' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            const selection = i.values[0];
            let settings;

            switch (selection) {
                case 'none':
                    settings = {
                        workMultiplier: 1,
                        tipsMultiplier: 1,
                        workCooldown: 0,
                        tipCooldown: 0,
                        description: "No Patreon perks are active."
                    };
                    break;
                case 'three_star_restaurant':
                    settings = {
                        workMultiplier: 1.5,
                        tipsMultiplier: 1.5,
                        workCooldown: 60,
                        tipCooldown: 60,
                        description: "3 Star Restaurant perks are now active."
                    };
                    break;
                case 'five_star_restaurant':
                    settings = {
                        workMultiplier: 2,
                        tipsMultiplier: 2,
                        workCooldown: 60,
                        tipCooldown: 60,
                        description: "5 Star Restaurant perks are now active."
                    };
                    break;
            }
            const settingsString = JSON.stringify(settings);
            console.log(settingsString);

            // Assuming you store these settings in a database keyed to the guild ID
            await db.set(`patreonPerks_${interaction.guild.id}`, settings);


            await i.editReply({ content: settings.description, components: [] });
        });
    }
};

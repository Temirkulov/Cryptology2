const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Whitelist a user to react to profile messages')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the user to whitelist')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('id');

        // Check if the user ID is a valid integer and within the length constraints
        if (!/^\d+$/.test(userId) || userId.length < 18 || userId.length > 24) {
            return interaction.reply({ content: 'Invalid user ID. Please provide a valid Discord user ID that is an integer, 18-24 characters long.', ephemeral: true });
        }

        // Add the user ID to the whitelist database
        const whitelist = await db.get('whitelist') || [];
        if (!whitelist.includes(userId)) {
            whitelist.push(userId);
            await db.set('whitelist', whitelist);
            
            let userInfo;
            try {
                const user = await interaction.client.users.fetch(userId);
                userInfo = `${user.username}#${user.discriminator}`;
            } catch (error) {
                userInfo = userId;
            }

            const embed = new EmbedBuilder()
                .setTitle('User Whitelisted')
                .setColor('#00FF00')
                .setDescription(`**User:** ${userInfo}\n**ID:** ${userId}`)
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } else {
            interaction.reply({ content: `User <@${userId}> is already whitelisted.`, ephemeral: true });
        }
    },
};

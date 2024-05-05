const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Provides information on how to use this bot'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700) // Gold color
            .setTitle('Welcome to the FAT Franchise Assistant Bot!')
            .setDescription("This bot is designed to help manage and track your Taco Shack in the FAT Franchise. Here's how to get started and use the bot effectively:")
            .setThumbnail('attachment://robot.png') // Referencing the thumbnail of the cute robot
            .addFields(
                { name: '🚀 Getting Started', value: "Run `/setup` and follow the reactions to initialize your shack's tracking system." },
                { name: '🛠️ Updating Your Shack', value: "Use `/upgrades` to update specific sections of your shack's upgrades for detailed tracking and management." },
                { name: 'ℹ️ Further Assistance', value: "If you need more help or encounter any issues, feel free to reach out in the support channel." },
                { name: '🔜 What’s Next?', value: "Stay tuned! Future updates will include more detailed individual commands for profile reports and other enhancements." }
            )
            .setFooter({ text: 'Bot created by Kulovich', iconURL: 'attachment://robot.png' }) // Optional: add an icon next to the footer text
            .setImage('attachment://robot.png'); // Optional: display a larger image below the embed

        await interaction.reply({ embeds: [embed], files: ['./path/to/robot.png'] });
    },
};

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
            .setThumbnail('https://media.discordapp.net/attachments/847140132980785152/1236662839826190466/robot.webp?ex=6638d385&is=66378205&hm=42e9ff1bd0a3bb70238561174b83101098894732c816e83add42e0cc7091fc84&=&format=webp&width=700&height=700') // Use the attachment URL for the thumbnail
            .addFields(
                { name: '🚀 Getting Started', value: "Run `/setup` and follow the reactions to initialize your shack's tracking system." },
                { name: '🛠️ Updating Your Shack', value: "Use `/upgrades` to update specific sections of your shack's upgrades for detailed tracking and management." },
                { name: 'ℹ️ Further Assistance', value: "If you need more help or encounter any issues, feel free to reach out in the support channel." },
                { name: '🔜 What’s Next?', value: "Stay tuned! Future updates will include more detailed individual commands for profile reports and other enhancements." }
            )
            .setFooter({ text: 'Bot created by Kulovich', iconURL: 'attachment://robot.webp' }) // Use the attachment URL for the footer icon
            // .setImage('https://media.discordapp.net/attachments/847140132980785152/1236662839826190466/robot.webp?ex=6638d385&is=66378205&hm=42e9ff1bd0a3bb70238561174b83101098894732c816e83add42e0cc7091fc84&=&format=webp&width=700&height=700'); // Use the attachment URL for the image

        await interaction.reply({ embeds: [embed] });
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Displays information about the bot.'),
    async execute(interaction) {
        const sourceDirectories = [
            path.join(__dirname, '../../commands/utility'),  // Adjusting path for actual structure
            path.join(__dirname, '../../commands/calculation'),
            path.join(__dirname, '../../commands/IdleCap'),
            path.join(__dirname, '../../utils/TacoShack')
        ];
        let totalLinesOfCode = 0;
        sourceDirectories.forEach(dir => {
            totalLinesOfCode += countLinesOfCode(dir);
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FFFF) // Neon light blue color
            .setTitle('Bot Information')
            .addFields(
                { name: ':bar_chart: Bot Statistics', value: `**Servers**: ${interaction.client.guilds.cache.size}\n**Users**: ${interaction.client.users.cache.size}\n**Channels**: ${interaction.client.channels.cache.size}`, inline: false },
                { name: ':page_facing_up: Bot Information', value: `**Creator**:\nkulovich\n**Original Creator**:\nocryptic\n**Contributors**:\ngegeberry\ninnerblu\n**Version**: 1.0\n**Lines of Code**: ${totalLinesOfCode}`, inline: false },
                { name: ':computer: Hosting Information', value: `**Memory Usage**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n**RAM**: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB\n**Uptime**: ${formatUptime(Math.floor(process.uptime()))}\n**Node.js**: ${process.version}\n**Discord.js**: ${require('discord.js').version}\n**Operating System**: ${os.type()} ${os.release()}`, inline: false }
                );

        await interaction.reply({ embeds: [embed] });
    }
};

function formatUptime(uptime) {
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));
    const weeks = Math.floor(uptime / (60 * 60 * 24 * 7));

    let timeString = '';
    if (weeks > 0) timeString += `${weeks} week${weeks > 1 ? 's' : ''}, `;
    if (days > 0) timeString += `${days} day${days > 1 ? 's' : ''}, `;
    if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''}, `;
    if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''}, `;
    timeString += `${seconds} second${seconds > 1 ? 's' : ''}`;

    return timeString;
}

function countLinesOfCode(directory) {
    let totalLines = 0;
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isDirectory()) {
            totalLines += countLinesOfCode(filePath); // Recursively count lines
        } else if (filePath.endsWith('.js')) {
            totalLines += fs.readFileSync(filePath, 'utf8').split('\n').length;
        }
    });
    return totalLines;
}

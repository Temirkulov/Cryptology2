const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Displays information about the bot.'),
    async execute(interaction) {
        const sourceDirectory = path.join(__dirname, '../'); // Adjust this path to your source code directory
        const totalLinesOfCode = countLinesOfCode(sourceDirectory);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Bot Information')
            .addFields(
                { name: 'Creator', value: 'kulovich', inline: true },
                { name: 'Original Creator', value: 'ocryptic', inline: true },
                { name: 'Contributors', value: 'gegeberry', inline: true },
                { name: 'Version', value: '1.0', inline: true },
                { name: 'Lines of Code', value: `${totalLinesOfCode}`, inline: true },
                { name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'Uptime', value: `${Math.floor(process.uptime())} seconds`, inline: true },
                { name: 'Operating System', value: `${os.type()} ${os.release()}`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: 'Discord.js', value: require('discord.js').version, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};

function countLinesOfCode(directory) {
    let totalLines = 0;
    fs.readdirSync(directory).forEach(file => {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isDirectory()) {
            totalLines += countLinesOfCode(filePath); // Recursively count lines in sub-directories
        } else if (filePath.endsWith('.js')) {
            totalLines += fs.readFileSync(filePath, 'utf8').split('\n').length;
        }
    });
    return totalLines;
}

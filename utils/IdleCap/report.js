const { MessageCollector, ActionRowBuilder, ButtonBuilder, ButtonStyle ,EmbedBuilder,SelectMenuBuilder,  delay } = require('discord.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Function to handle message creation for profile data collection
async function handleProfileDataCollection(client) {
    client.on('messageCreate', async message => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        const filter = m => m.embeds.length > 0; // Filter for messages with at least one embed
        const options = {
            maxProcessed: 1,
            max: 1, // Stop collecting after 1 message
        };
    
        if (message.content.toLowerCase() === '<@512079641981353995>profile' || message.content.toLowerCase() === '<@512079641981353995>p'|| message.content.toLowerCase() === '<@512079641981353995> profile' || message.content.toLowerCase() === '<@512079641981353995> p') {
            const collector = new MessageCollector(message.channel, filter, options);
            
            collector.on('collect', async el => {
                // Initialize an object to store all the extracted data
                let userData = {};
                // else
                // Safely accessing the first embed's fields
                if (!el.embeds[0]) return;
                if (el.embeds[0] && el.embeds[0].fields) {
                    const fields = el.embeds[0].fields;

                    fields.forEach(field => {
                        let value;
                        switch(field.name) {
                            case 'Corporation':
                                value = field.value.split('🏛 ')[1];
                                userData.corporation = value;
                                break;
                            // Add other cases as before, adjusting to directly set the value in userData
                            // Example for 'Balance':
                            case 'Balance':
                                value = field.value.split('💰 $')[1].replace(/,/g, '');
                                userData.balance = value;
                                break;
                            case 'Income':
                                key = 'income';
                                value = field.value.split('💸 $')[1].split('/min')[0].replace(/,/g, ''); // Assuming the format "💸 $76.00/min", remove commas
                                userData.income = value;
                                break;
                            case 'Prestige':
                                key = 'prestige';
                                value = field.value.split('🔰 ')[1]; // Assuming the format "🔰 1"
                                userData.prestige = value;
                                break;
                            case 'Prestige Points':
                                key = 'prestigePoints';
                                value = field.value.split('💠 ')[1]; // Assuming the format "💠 0"
                                break;
                            case 'Coins':
                                key = 'coins';
                                // Assuming the format "<:coin:713481704152629290> 15"
                                // Directly extracting the number after the emoji. If the emoji format can vary, consider using a regex to extract the numeric part.
                                value = field.value.replace(/<:[^:]+:\d+>\s*/, '').replace(/,/g, '');
                                userData.coins = value;
                                break;
                            case 'Briefcases':
                                key = 'briefcases';
                                value = field.value.split('💼 ')[1].replace(/,/g, ''); // Assuming the format "💼 2"
                                userData.briefcases = value;
                                break;
                            case 'Total Multiplier':
                                key = 'totalMultiplier';
                                value = field.value.split('📈 ')[1].replace('x', ''); // Assuming the format "📈 1.00x", remove the 'x'
                                userData.totalmultiplier = value;
                                break;
                            // Add more cases as needed
                        }
                    });
    
                    // After processing all fields, save userData under a single key
                    if (Object.keys(userData).length > 0) {
                        db.set(`userData.${message.author.id}`, userData);
                    } else {
                        console.log(`Attempted to save empty userData for ${message.author.id}, operation skipped.`);
                    }
                    console.log(`Data saved for ${message.author.id}`, userData);
                } else {
                    console.log("The collected message does not contain embeds with fields.");
                }
            });
    
            // Your reply logic remains unchanged
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('downloadData')
                        .setLabel('Download Data')
                        .setStyle(ButtonStyle.Primary),
                );
            await delay(2000);
            await message.reply({ content: 'Click for Profile Report!', components: [row] });
        }
    });
    }

// Function to handle interactions for displaying profile data
async function handleProfileDataDisplay(client) {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;
    
        const userId = interaction.user.id;
    
        // Retrieve the entire userData object with a single database call
        const storedUserData = await db.get(`userData.${userId}`);
    
        if (interaction.customId === 'downloadData') {
            // Assuming storedUserData exists and has the necessary data
            if (storedUserData) {
                const description = Object.keys(storedUserData).map(key => {
                    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${storedUserData[key]}`;
                }).join('\n');
    
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Data for ${interaction.user.username}`)
                    .setDescription(description);
    
                // Select Menu
                const selectMenu = new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId('select')
                            .setPlaceholder('Nothing selected')
                            .addOptions([
                                {
                                    label: 'Earth',
                                    description: 'Earth Report',
                                    value: 'earth',
                                },
                                {
                                    label: 'Moon',
                                    description: 'This is a description for Option 2',
                                    value: 'moon',
                                },
                            ]),
                    );
    
                // Button
                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('displayData')
                            .setLabel('Display Data')
                            .setStyle(ButtonStyle.Primary),
                    );
    
                // Reply with the confirmation embed and the "Display Data" button
                await interaction.reply({ embeds: [embed], components: [selectMenu, buttonRow] });
            } else {
                // Handle the case where no userData was found
                await interaction.reply({ content: "No data found.", ephemeral: true });
            }
        }
    



            else if (interaction.customId === 'displayData') {
            // Check if the userData exists before trying to display it
            if (storedUserData) {
                // Construct the description string using all available userData
                let description = Object.keys(storedUserData).map(key => {
                    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${storedUserData[key]}`;
                }).join('\n');
    
                const dataEmbed = new EmbedBuilder()
                    .setColor(0x00AE86)
                    .setTitle(`Data for ${interaction.user.username}`)
                    .setDescription(description);
    
                await interaction.reply({ embeds: [dataEmbed] });
            } else {
                // Handle the case where no userData was found
                await interaction.reply({ content: "No data found.", ephemeral: false });
            }
        }
    });
    }

module.exports = { handleProfileDataCollection, handleProfileDataDisplay };

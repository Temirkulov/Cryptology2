// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const { token } = require('./config.json');
const { Collection } = require('discord.js')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { MessageCollector } = require('discord.js');
const { handleProfileDataCollection, handleProfileDataDisplay } = require('./utils/IdleCap/report'); // Adjust the path based on the new location



// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// Require the listener modules
//reaction listeners path
const idleCapReactionListener = require('./utils/IdleCap/ReactionListener');
const tacoShackReactionListener = require('./utils/TacoShack/ReactionListener');
//message listeners path
const idleCapListeners = require('./utils/IdleCap/Listener');
const tacoShackListeners = require('./utils/TacoShack/Listener');

// Use the listener functions
//reaction listeners
idleCapReactionListener.handleIdleCapReactionAdd(client);
tacoShackReactionListener.handleTacoShackReactionAdd(client);
//message listeners
idleCapListeners.handleIdleCapMessageCreate(client);
idleCapListeners.handleIdleCapMessageUpdate(client);
tacoShackListeners.handleTacoShackMessageCreate(client);
tacoShackListeners.handleTacoShackMessageUpdate(client);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}


// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    handleProfileDataCollection(client);
    handleProfileDataDisplay(client);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});
// client.on('messageUpdate', (oldMessage, newMessage) => {
//     // Ensure the updated message is from a bot but not your own bot
//         // Check if the new message has embeds
//         if (newMessage.author.bot && newMessage.author.id !== client.user.id) {
//         if (newMessage.embeds.length > 0) {
//             newMessage.embeds.forEach((embed, index) => {
//                 console.log(`Embed ${index + 1} updated by ${newMessage.author.username}:`);
//                 // Check if this embed has fields
//                 if (embed.fields && embed.fields.length > 0) {
//                     embed.fields.forEach((field, fieldIndex) => {
//                         console.log(`Field ${fieldIndex + 1}: Name: ${field.name}, Value: ${field.value}`);
//                     });
//                 } else {
//                     console.log("This embed has no fields.");
//                 }
//             });
//         }
//     }
// });
// client.on('messageCreate', async message => {
//     if (message.author.bot && message.author.id === '490707751832649738') {
//         console.log("Reacting to the bot message...");

//         try {
//             await message.react('📋');
//         } catch (error) {
//             console.error("Failed to react:", error);
//             return; // Stop further execution if reacting fails
//         }

//         const filter = (reaction, user) => {
//             console.log(`Reaction received: ${reaction.emoji.name}, by user: ${user.tag}`);
//             return reaction.emoji.name === '📋' && !user.bot;
//         };

//         console.log("Setting up reaction collector...");

//         message.awaitReactions({ filter, max: 1, time: 30000 })
//             .then(collected => {
//                 const reaction = collected.first();
//                 if (reaction) {
//                     const user = reaction.users.cache.filter(u => !u.bot).first();
//                     console.log(`Successfully collected ${reaction.emoji.name} from ${user.tag}`);
//                     // Proceed with further logic here
//                 }
//             })
//             .catch(error => console.error("Failed to collect reactions:", error));
//     }
// });

// Log in to Discord with your client's token
client.login(token);
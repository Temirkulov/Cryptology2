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
// idleCapReactionListener.handleIdleCapReactionAdd(client);
tacoShackReactionListener.handleTacoShackReactionAdd(client);
//message listeners
// idleCapListeners.handleIdleCapMessageCreate(client);
// idleCapListeners.handleIdleCapMessageUpdate(client);
tacoShackListeners.handleTacoShackMessageCreate(client);
tacoShackListeners.handleTacoShackMessageUpdate(client);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath).filter(item => {
    const itemPath = path.join(foldersPath, item);
    return fs.statSync(itemPath).isDirectory();  // Only include if item is a directory
});

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

const emojis = [
    '<a:yes:1247259394287075339>', '<a:winky:1247263388111736845>', '<a:wholesquadlaughing:1247263125892366467>', '<a:triggered:1247263615770165348>',
    '<:pepe_ping:1247263547591757936>', '<a:pingSockRed:1247263306591375512>', '<:plznobully:1247263567598583938>', '<a:punch:1247263585462390869>',
    '<a:robber:1247263333074075761>', '<a:running:1247262872074194964>', '<a:sailor_annoyed:1247262846451187742>', '<a:snipe:1247263356113387611>',
    '<a:stressed:1247263101779447908>', '<a:okayu_clap:1247263530491838464>', '<:nopingme:1247263262844911799>', '<a:nono:1247262890793369723>',
    '<a:nod:1247259462046318703>', '<a:mwah:1247262815442698280>', '<a:meowcat:1247263703888564344>', '<a:memeified_sus:1247262560768753694>',
    '<a:memeified_LVgold:1247259607873880115>', '<:cz_GWczeWhat:1247263671768449156>', '<a:egp_evil:1247263600456761529>', '<a:flushed2:1247263201872052344>',
    '<a:glow_neondead:1247259547576307723>', '<a:haachama:1247263473663217766>', '<a:hmph:1247263065703977012>', '<:kekwtf:1247263237695864965>',
    '<a:kitty:1247263083861115040>', '<a:korone_attack:1247263499147677766>', '<a:catno:1247262785474134098>', '<a:bonkdoge:1247262744827269158>',
    '<a:bang_cry:1247263642848858113>', '<a:aNgErY:1247263455841615946>', '<a:XDDDD:1247262656524456008>', '<a:WHAT:1247263044275277985>',
    '<a:TakethatL:1247262685570011341>', '<a:Soldier:1247263143202132018>', '<:Shame:1247263163741896768>', '<a:BurgerLove:1247262938222301374>',
    '<a:FeelsWeirdMan:1247262917934579809>', '<a:NM_RGBGirl:1247262626170535993>', '<a:NM_peepoHeadLove:1247263011761029163>', '<a:NM_peepoMadPing:1247262994665308322>',
    '<a:NM_peepoReindeer:1247262975727763466>', '<a:PepeMedal:1247258912860934285>', '<a:Pepe_Pray:1247263424086544409>'
];

// Function to react with a random emoji
function reactWithRandomEmoji(message) {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    message.reply(randomEmoji).catch(console.error);
}
client.on('messageCreate', async message => {
    // Check if the bot is mentioned
    if (message.mentions.has(client.user)) {
        reactWithRandomEmoji(message);
    }
});

client.login(token);
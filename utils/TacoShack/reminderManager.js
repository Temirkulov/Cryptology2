// reminderManager.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const activeReminders = new Map(); // This map will store active reminder timeouts

function setReminder(userId, fieldName, delay, callback) {
    clearReminder(userId, fieldName); // Clear existing reminder if any

    const executionTime = Date.now() + delay;
    const timeout = setTimeout(() => {
        callback();
        clearReminderFromDB(userId, fieldName);
    }, delay);

    const userReminders = activeReminders.get(userId) || {};
    userReminders[fieldName] = timeout;
    activeReminders.set(userId, userReminders);
    saveReminderToDB(userId, fieldName, executionTime);

    console.log(`Reminder set for ${userId} - ${fieldName} in ${delay} ms, executes at ${new Date(executionTime).toLocaleString()}`);
}

async function saveReminderToDB(userId, fieldName, executionTime) {
    const saveStatus = await db.set(`reminder_${userId}_${fieldName}`, { fieldName, executionTime });
    console.log(`Reminder data saved to DB for ${userId} - ${fieldName}`, saveStatus);
}


async function clearReminderFromDB(userId, fieldName) {
    await db.delete(`reminder_${userId}_${fieldName}`);
}

async function clearReminder(userId, fieldName) {
    const userReminders = activeReminders.get(userId);
    if (userReminders && userReminders[fieldName]) {
        clearTimeout(userReminders[fieldName]);
        delete userReminders[fieldName];
        await db.delete(`reminder_${userId}_${fieldName}`);
        console.log(`Cleared reminder for ${userId} - ${fieldName}`);
    }
}

async function clearAllReminders(userId) {
    const userReminders = activeReminders.get(userId);
    if (userReminders) {
        Object.keys(userReminders).forEach(async fieldName => {
            clearTimeout(userReminders[fieldName]);
            await db.delete(`reminder_${userId}_${fieldName}`);
            console.log(`Cleared all reminders for ${userId} - ${fieldName}`);
        });
        activeReminders.delete(userId);
    }
}

async function manageReminders(userId, command, interval) {
    await cancelReminder(userId, command);
    await setReminder(userId, command, interval);
}
async function enableReminders(userId, embedData) {
    embedData.fields.forEach(async field => {
        if (field.value.includes('❌')) {
            const cooldownTime = parseCooldown(field.value);  // Assuming parseCooldown returns time in seconds
            await setReminder(userId, field.name, cooldownTime);
        }
    });
}

async function disableReminders(userId) {
    // Assuming you have some structure to track what reminders are set
    const activeReminders = await db.get(`activeReminders_${userId}`) || [];
    activeReminders.forEach(async reminder => {
        await cancelReminder(userId, reminder.command);
    });
}
async function processReminders(message, userId, cooldownData) {
    const userData = await db.get(`shackData.${userId}`);
    if (!userData || !userData.reminders) {
        console.log(`Reminders not enabled or user data not found for user ID: ${userId}`);
        return;
    }

    const now = Date.now();

    for (const field of cooldownData.fields) {
        if (field.value.startsWith('❌')) {
            const delay = parseCooldown(field.value);
            const reminderKey = `reminder_${userId}_${field.name}`;
            const existingReminder = await db.get(reminderKey);
        
            if (existingReminder) {
                const timeLeft = existingReminder.executionTime - now;
                if (shouldSkipReminderUpdate(field.value, timeLeft)) {
                    console.log(`Skipping reminder update for ${field.name} as the existing reminder is within the minimal difference time.`);
                    continue;  // Skip setting a new reminder if the current one is still valid
                }
            }
        
            setReminder(userId, field.name, delay, async () => {
                const freshUserData = await db.get(`shackData.${userId}`);
                if (freshUserData && freshUserData.reminders) {
                    await message.channel.send(formatReminderMessage(userId, field.name));
                    console.log(`Reminder sent to channel ${message.channel.id} for user ${userId} regarding ${field.name}`);
                }
            });
        }
    }
}

function formatReminderMessage(userId, reminderType) {
    const reminderTypeIds = {
        'Tips': '1203826208383696957',
        'Work': '1203826210250166292',
        'Overtime': '1203826204356911104'
    };
    const commandId = reminderTypeIds[reminderType] || 'default';
    return `<@${userId}> Your </${reminderType.toLowerCase()}:${commandId}> is now ready!`;
}
function shouldSkipReminderUpdate(value, timeLeft) {
    const { time, unit } = parseTimeAndUnit(value);
    const timeInMilliseconds = time * (unit.startsWith('hour') ? 3600000 : (unit.startsWith('minute') ? 60000 : 1000));
    
    // Skip if the existing reminder is set to trigger within a minute of the new reminder time for short durations
    if (Math.abs(timeInMilliseconds - timeLeft) < 60000) {
        return true;  // Skip update if the current reminder is due soon and the new one is not significantly different
    }
    return false;
}

function parseTimeAndUnit(value) {
    const match = value.match(/(\d+)\s*(minutes|hours)/);
    if (match) {
        return { time: parseInt(match[1], 10), unit: match[2] };
    }
    return { time: 0, unit: 'seconds' };
}


async function listActiveReminders(userId, author) {
    const allReminders = await db.startsWith(`reminder_${userId}`);
    const now = Date.now();
    let hasReminders = false;

    const embed = new EmbedBuilder()
        .setColor(0xFF9900)  // Warm orange color
        .setTitle('🔔 Your Active Reminders')
        .setDescription("Checking for active reminders...")
        .setThumbnail(author.displayAvatarURL())
        .setFooter({ text: `Reminders for ${author.username}`, iconURL: author.displayAvatarURL() });

    if (allReminders.length === 0) {
        embed.setDescription("You currently have no active reminders.");
    } else {
        embed.setDescription("Here's when your next activities are due:");
        for (const reminder of allReminders) {
            if (!reminder.id) {
                console.error("Reminder object is missing the 'id' property:", reminder);
                continue;
            }

            const fieldName = reminder.id.split('_').pop();
            const executionTime = reminder.value.executionTime;
            const timeLeftMs = executionTime - now;
            const timeLeft = formatTime(timeLeftMs);

            embed.addFields({ name: `⏰ ${fieldName}`, value: `Next reminder in ${timeLeft}`, inline: false });
            hasReminders = true;
        }
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('toggle_reminders')
                .setLabel(hasReminders ? 'Disable Reminders' : 'Enable Reminders')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('view_profile')
                .setLabel('View Profile')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [row] };
}

function formatTime(milliseconds) {
    let totalSeconds = Math.round(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${hours > 0 ? `${hours} hours ` : ''}${minutes > 0 ? `${minutes} minutes ` : ''}${seconds} seconds`;
}

function parseCooldown(value) {
    const regex = /(\d+)\s*(second|seconds|minute|minutes|hour|hours)/;
    const matches = value.match(regex);
    if (!matches) return 0;

    let time = parseInt(matches[1], 10);
    switch (matches[2]) {
        case 'second':
            return time * 1000;
        case 'seconds':
            return time * 1000;
        case 'minute':
            return time * 60000;
        case 'minutes':
            return time * 60000;
        case 'hour':
            return time * 3600000;
        case 'hours':
            return time * 3600000;
        default:
            return 0;
    }
}

module.exports = {
    manageReminders,
    clearAllReminders,
    clearReminder,
    setReminder,
    enableReminders,
    disableReminders,
    processReminders,
    parseCooldown,
    listActiveReminders
};

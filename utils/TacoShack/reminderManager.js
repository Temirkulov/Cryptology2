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
        'Overtime': '1203826204356911104',
        'Daily' : '1203826197352677416',
        'Clean' : '1203826195511250967',
        'Vote' : '1203826209532682312',
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



function formatTime(milliseconds) {
    let totalSeconds = Math.round(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes} min ` : ''}${seconds}s`;
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
    formatTime,

    reminderHandler: function (client) {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;
        
            // Handle Reminder Toggle Button
            if (interaction.customId === 'toggle_reminders') {
                // Prevent interaction from expiring
                await interaction.deferUpdate();
        
                const userId = interaction.user.id;
                const userData = await db.get(`shackData.${userId}`);
        
                if (!userData) {
                    console.log(`No user data found for user ID: ${userId}`);
                    return;
                }
        
                // Toggle the reminder state
                userData.reminders = !userData.reminders;
                await db.set(`shackData.${userId}`, userData);
        
                // Update the user on the new state of their reminders
                const newState = userData.reminders ? "enabled" : "disabled";
                await interaction.followUp({ content: `Reminders have been ${newState}.`, ephemeral: true });
        
                // Optionally, refresh the message to show updated buttons or information
                // This part depends on how you want to handle UI updates
                // For example, send a new message or update the existing one with the new state of reminders
            }
        });
        
    }
};

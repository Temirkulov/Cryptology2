// reminderManager.js

const { QuickDB } = require('quick.db');
const db = new QuickDB();

const activeReminders = new Map(); // This map will store active reminder timeouts

function setReminder(userId, fieldName, delay, callback) {
    clearReminder(userId, fieldName); // Clear existing reminder if any

    const timeout = setTimeout(callback, delay);
    const userReminders = activeReminders.get(userId) || {};
    userReminders[fieldName] = timeout;
    activeReminders.set(userId, userReminders);

    console.log(`Reminder set for ${userId} - ${fieldName} in ${delay} ms`);
}

function clearReminder(userId, fieldName) {
    const userReminders = activeReminders.get(userId);
    if (userReminders && userReminders[fieldName]) {
        clearTimeout(userReminders[fieldName]);
        delete userReminders[fieldName];
        console.log(`Cleared reminder for ${userId} - ${fieldName}`);
    }
}

function clearAllReminders(userId) {
    const userReminders = activeReminders.get(userId);
    if (userReminders) {
        Object.keys(userReminders).forEach(fieldName => {
            clearTimeout(userReminders[fieldName]);
            console.log(`Cleared reminder for ${userId} - ${fieldName}`);
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
    const activeReminders = await db.get(`activeReminders.${userId}`) || [];
    activeReminders.forEach(async reminder => {
        await cancelReminder(userId, reminder.command);
    });
}
async function processReminders(message, userid, cooldownData) {
    const userId = userid;
    const userData = await db.get(`shackData.${userId}`);
    if (!userData || !userData.reminders) {
        console.log(`Reminders not enabled or user data not found for user ID: ${userId}`);
        return;
    }

    cooldownData.fields.forEach(async (field) => {
        if (field.value.startsWith('❌')) {
            const delay = parseCooldown(field.value);
            setReminder(userId, field.name, delay, async () => {
                const freshUserData = await db.get(`shackData.${userId}`);
                if (freshUserData && freshUserData.reminders) {
                    await message.channel.send(`<@${userId}> Your cooldown for ${field.name} is now ready!`);
                    console.log(`Reminder sent to channel ${message.channel.id} for user ${userId} regarding ${field.name}`);
                }
            });
        }
    });
}

function parseCooldown(value) {
    const regex = /(\d+)\s*(seconds|minutes|hours)/;
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
    parseCooldown
};

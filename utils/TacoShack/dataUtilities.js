// src/data/dataUtilities.js

const { defaultShackData } = require('./shackDataStructure');


function getNewShackDataInstance() {
    return JSON.parse(JSON.stringify(defaultShackData)); // Deep copy to prevent mutation of the default template

}

function addUpgrade(shackData, location, upgradeCategory, upgradeKey, upgradeValue) {
    const locationData = shackData.locations[location];
    if (!locationData) {
        console.warn(`Invalid location: ${location}`);
        return;
    }

    const categoryData = locationData[upgradeCategory];
    if (!categoryData) {
        console.warn(`Invalid upgrade category: ${upgradeCategory} for location: ${location}`);
        return;
    }

    // Assuming upgradeValue is the complete new value for the upgrade
    categoryData[upgradeKey] = upgradeValue;
}

// Assuming 'shackData' is the data structure for a user's shack
// dataUtilities.js
function setActiveLocation(shackData, location) {
    // Ensure shackData and shackData.info are defined
    if (shackData && shackData.info) {
        shackData.info.activeLocation = location;
    } else {
        console.error("setActiveLocation called with undefined shackData or shackData.info");
    }
}

function updateBasicInfo(shackData, { username = null, userid = null, shackName = null, level = null, franchiseStatus = null }) {
    if (username !== null) shackData.info.username = username;
    if (userid !== null) shackData.info.userid = userid;
    if (shackName !== null) shackData.info.shackName = shackName;
    if (level !== null) shackData.info.level = level;
    if (franchiseStatus !== null) shackData.info.franchiseStatus = franchiseStatus;
}

// This function simplifies the update of the information related to a specific location
// locationKey: string, e.g., "taco", "beach", etc.
// infoUpdates: Object with the same structure as the info object for a location, but only with the fields to be updated
function updateLocationInfo(shackData, locationKey, infoUpdates) {
    const location = shackData.locations[locationKey];
    if (!location) {
        console.warn(`Invalid location: ${locationKey}`);
        return;
    }
    
    Object.keys(infoUpdates).forEach(key => {
        location.info[key] = infoUpdates[key];
    });
}
module.exports = {
    getNewShackDataInstance,
    addUpgrade,
    setActiveLocation,
    updateBasicInfo,
    updateLocationInfo
};

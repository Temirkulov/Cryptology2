// utils/TacoShack/data/shackDataStructure.js

const defaultShackData = {
    info: {
        username: "",
        userid: "",
        shackName: "",
        level: 0,
        franchise: "",
        franchiseStatus: "",
        activeLocation: "",
    },
    location: {
        taco: { info: {}, upgrades: {}, hire: {}, decorations: {}, advertisements: {}, truck: {} },
        beach: { info: {}, upgrades: {}, hire: {}, decorations: {}, advertisements: {}, stand: {} },
        city: { info: {}, upgrades: {}, hire: {}, decorations: {}, advertisements: {}, cart: {} },
        mall: { info: {}, upgrades: {}, hire: {}, decorations: {}, advertisements: {}, kiosk: {} },
        amusement: { info: {}, upgrades: {}, hire: {}, decorations: {}, advertisements: {}, attractions: {} },
    }
};

module.exports = { defaultShackData };

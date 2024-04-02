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
        hqPresent: false,
    },
    location: {
        taco: { info: {
            expansion: false,
        }, upgrades: {
            paint: 0,
            furniture: 0,
            bathrooms: 0,
            billboard: 0,
            appliances: 0,
            tipjar: 0,
        }, hire: {
            apprentice: 0,
            cook: 0,
            advertiser: 0,
            greeter: 0,
            sous: 0,
            head: 0,
            executive: 0,
        }, decorations: {
            flowers: 0,
            ornaments: 0,
            lights: 0,
            mural: 0,
            statue: 0,
        }, advertisements: {
            newspaper: 0,
            radio: 0,
            email: 0,
            internet: 0,
            tv: 0,
            blimp: 0,
        }, truck: {
            register: 0,
            assistant: 0,
            driver: 0,
            kitchen: 0,
            engine: 0,
} },
        beach: { info: {
            expansion: false,
        }, upgrades: {
            paint: 0,
            furniture: 0,
            bathrooms: 0,
            billboard: 0,
            appliances: 0,
            tipjar: 0,

        }, hire: {
            apprentice: 0,
            cook: 0,
            advertiser: 0,
            greeter: 0,
            sous: 0,
            head: 0,
            executive: 0,

        }, decorations: {
            shells: 0,
            umbrella: 0,
            leis: 0,
            tanks: 0,
            fountain: 0,

        }, advertisements: {
            newspaper: 0,
            radio: 0,
            email: 0,
            internet: 0,
            tv: 0,
            blimp: 0,

        }, stand: {
            decals: 0,
            wheels: 0,
            mixers: 0,
            server: 0,
            freezer: 0,

        } },
        city: { info: {
            expansion: false,
        }, upgrades: {
            paint: 0,
            furniture: 0,
            bathrooms: 0,
            billboard: 0,
            appliances: 0,
            tipjar: 0,

        }, hire: {
            apprentice: 0,
            cook: 0,
            advertiser: 0,
            greeter: 0,
            sous: 0,
            head: 0,
            executive: 0,

        }, decorations: {
            banner: 0,
            sign: 0,
            glass: 0,
            artwork: 0,
            chandelier: 0,

        }, advertisements: {
            newspaper: 0,
            radio: 0,
            email: 0,
            internet: 0,
            tv: 0,
            blimp: 0,

        }, cart: {
            buns: 0,
            condiments: 0,
            beverages: 0,
            coolers: 0,
            grill: 0,

        } },
        mall: { info: {
            expansion: false,
        }, upgrades: {
            paint: 0,
            furniture: 0,
            bathrooms: 0,
            billboard: 0,
            appliances: 0,
            tipjar: 0,

        }, hire: {
            cashier: 0,
            associate: 0,
            janitor: 0,
            security: 0,
            sales: 0,
            leader: 0,
            manager: 0,

        }, decorations: {
            chair: 0,
            booth: 0,
            display: 0,
            buffet: 0,
            screen: 0,

        }, advertisements: {
            newspaper: 0,
            radio: 0,
            email: 0,
            internet: 0,
            tv: 0,
            blimp: 0,

        }, kiosk: {
            taco: 0,
            repair: 0,
            froyo: 0,
            photo: 0,
            merch: 0,

        } },
        amusement: { info: {
            expansion: false,
        }, upgrades: {
            paint: 0,
            furniture: 0,
            bathrooms: 0,
            billboard: 0,
            appliances: 0,
            tipjar: 0,

        }, hire: {
            apprentice: 0,
            cook: 0,
            advertiser: 0,
            greeter: 0,
            sous: 0,
            head: 0,
            executive: 0,

        }, decorations: {
            benches: 0,
            speaker: 0,
            balloon: 0,
            fireworks: 0,
            plushies: 0,

        }, advertisements: {
            newspaper: 0,
            radio: 0,
            email: 0,
            internet: 0,
            tv: 0,
            blimp: 0,

        }, attractions: {
            toss: 0,
            arcade: 0,
            carnival: 0,
            carousel: 0,
            coaster: 0,
            ferris: 0,

        } },
    },
    hq: {
        info: {
            hqname: "",
            balance: 0,
            income: 0,
            tip: 0,
            work: 0,
            overtime: 0,
            lunchrush: 0,
            taskmultiplier: 0,
        },
        upgrades: {
            customerservicedepartment: 0,
            foodservicesdepartment: 0,
            overtimemanagement: 0,
            lunchrushinitiative: 0,
            taskbooster: 0,
        },
        hire: {
            secretary: 0,
            treasurer: 0,
            chieffinancialofficer: 0,
            chiefexecutiveofficer: 0,
        },
    }
};

module.exports = { defaultShackData };

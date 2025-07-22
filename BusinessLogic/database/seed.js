const db = require('./db');
const bcrypt = require('bcryptjs');

const init = require('../models/init-models');
const { DATE } = require('sequelize');
const {
    ATtoETAssignment,
    Alerts,
    AlertsTypes,
    Deliveries,
    DisplayElementsAssignment,
    Displays,
    ElementsTypes,
    Groups,
    MapsAndElements,
    MapsToGroupAssignment,
    Membership,
    Orders,
    Users,
} = init(db);

async function seed() {
    try {
        await ElementsTypes.bulkCreate([{ name: 'Mapa' }, { name: 'Order' }, { name: 'Sektor' }]);

        await MapsAndElements.bulkCreate([
            { EID: 2, ParentEID: null, ETID: 1, name: 'Mapa 1', DimensionsAndStructure_json: '{}' },
            { EID: 3, ParentEID: 2, ETID: 3, name: 'Sektor 1', DimensionsAndStructure_json: '{}' },
            { EID: 4, ParentEID: 2, ETID: 3, name: 'Sektor 2', DimensionsAndStructure_json: '{}' },
            { EID: 5, ParentEID: 2, ETID: 3, name: 'Sektor 3', DimensionsAndStructure_json: '{}' },
            { EID: 6, ParentEID: null, ETID: 1, name: 'Hala 9', DimensionsAndStructure_json: '{}' },
            { EID: 7, ParentEID: 6, ETID: 3, name: 'Sektor 4', DimensionsAndStructure_json: '{}' },
            {
                EID: 16,
                ParentEID: 3,
                ETID: 2,
                name: 'Zlecenie1',
                DimensionsAndStructure_json: '{}',
            },
            {
                EID: 19,
                ParentEID: 3,
                ETID: 2,
                name: 'Zlecenie2',
                DimensionsAndStructure_json: '{}',
            },
            { EID: 20, ParentEID: 3, ETID: 2, name: 'Zlecenie3', DimensionsAndStructure_json: '{}' },
            { EID: 21, ParentEID: 3, ETID: 2, name: 'Zlecenie4', DimensionsAndStructure_json: '{}' },
            { EID: 22, ParentEID: 3, ETID: 2, name: 'Zlecenie5', DimensionsAndStructure_json: '{}' },
            { EID: 23, ParentEID: 3, ETID: 2, name: 'Zlecenie6', DimensionsAndStructure_json: '{}' },
            { EID: 24, ParentEID: 3, ETID: 2, name: 'Zlecenie7', DimensionsAndStructure_json: '{}' },
            { EID: 25, ParentEID: 3, ETID: 2, name: 'Zlecenie8', DimensionsAndStructure_json: '{}' },
        ]);

        await Orders.bulkCreate([
            { OID: 1, EID: 16, State: 0, Priority: 1, deadline: new Date('2025-06-23 18:08:09') },
            { OID: 2, EID: 19, State: 0, Priority: 1, deadline: new Date('2025-07-23 18:12:39') },
            { OID: 3, EID: 20, State: 1, Priority: 1, deadline: new Date('2025-06-23 18:08:09') },
            { OID: 4, EID: 21, State: 1, Priority: 1, deadline: new Date('2025-05-23 18:12:39') },
            { OID: 5, EID: 22, State: 2, Priority: 1, deadline: new Date('2025-04-23 18:08:09') },
            { OID: 6, EID: 23, State: 2, Priority: 1, deadline: new Date('2025-03-23 18:12:39') },
            { OID: 7, EID: 24, State: 1, Priority: 1, deadline: new Date('2025-02-23 18:08:09') },
            { OID: 8, EID: 25, State: 1, Priority: 1, deadline: new Date('2025-03-23 18:12:39') },
        ]);

        let orders = generateOrders(9, 26, 1000);
        // await MapsAndElements.bulkCreate(orders[0]);
        // await Orders.bulkCreate(orders[1]);

        await AlertsTypes.bulkCreate([
            { AAID: 1, name: 'Brak elementu' },
            { AAID: 2, name: 'Złe zlecenie na sektorze' },
            { AAID: 3, name: 'Inny problem' },
        ]);

        await Alerts.bulkCreate([
            { AAID: 1, EID: 16, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 16, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 16, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 16, State: 1, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 16, State: 1, date: new Date('2024-11-23 18:08:09') },
            { AAID: 2, EID: 3, State: 1, date: new Date('2024-11-23 18:12:39') },
            { AAID: 2, EID: 3, State: 1, date: new Date('2024-11-23 18:12:39') },
            { AAID: 3, EID: 2, State: 0, date: new Date('2024-11-23 18:12:39') },
        ]);
        // await Alerts.bulkCreate(generateAlerts(26, 50));

        await ATtoETAssignment.bulkCreate([
            { AAID: 1, ETID: 2 },
            { AAID: 2, ETID: 3 },
            { AAID: 3, ETID: 1 },
            { AAID: 3, ETID: 2 },
            { AAID: 3, ETID: 3 },
        ]);

        await Deliveries.bulkCreate([
            { OID: 1, State: 0, date: new Date('2024-11-23 18:08:09') },
            { OID: 1, State: 0, date: new Date('2024-11-23 18:12:39') },
            { OID: 1, State: 0, date: new Date('2024-11-23 18:16:39') },
            { OID: 2, State: 0, date: new Date('2024-11-23 18:12:39') },
            { OID: 2, State: 0, date: new Date('2024-11-23 18:16:39') },
        ]);

        await Displays.bulkCreate([
            { DID: 1, name: 'asd', UUID: '8c029a90-074a-4f24-a2d0-d80cad6338f5', validated: 1 },
            { DID: 2, name: 'asd2', UUID: 'f3c10244-b6eb-4267-abce-6e2809446b5c', validated: 1 },
        ]);

        await DisplayElementsAssignment.bulkCreate([
            { DEAID: 1, DID: 1, EID: 3 },
            { DEAID: 2, DID: 1, EID: 4 },
            { DEAID: 3, DID: 1, EID: 5 },
            { DEAID: 4, DID: 2, EID: 6 },
        ]);

        await Groups.bulkCreate([
            { GID: 1, name: 'Administrators' },
            { GID: 2, name: 'Kierownik Hala 9' },
        ]);

        await MapsToGroupAssignment.bulkCreate([
            { GID: 1, EID: 2 },
            { GID: 1, EID: 6 },
            { GID: 2, EID: 6 },
        ]);

        await Users.bulkCreate([
            {
                login: 'Administrator',
                email: 'tak@wp.pl',
                passwd: bcrypt.hashSync('ZAQ12wsx@#', 10),
                PersonalSettings_json: '{"primaryColor":"green","darkMode":true}',
            },
            { login: 'Kierownik', email: 'tak2@wp.pl', passwd: bcrypt.hashSync('ZAQ12wsx@#', 10) },
        ]);

        await Membership.bulkCreate([
            { MemID: 1, GID: 1, UID: 1 },
            { MemID: 2, GID: 2, UID: 2 },
        ]);

        console.log('Data seeded successfully.');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

function generateOrders(startingOID, startingEID, amount) {
    let EIDs = [];
    let OIDs = [];
    const probabilities = [
        { month: 0, probability: 0.08 },
        { month: 1, probability: 0.12 },
        { month: 2, probability: 0.1 },
        { month: 3, probability: 0.08 },
        { month: 4, probability: 0.15 },
        { month: 5, probability: 0.16 },
        { month: 6, probability: 0.1 },
        { month: 7, probability: 0.07 },
        { month: 8, probability: 0.03 },
        { month: 9, probability: 0.05 },
        { month: 10, probability: 0.05 },
        { month: 11, probability: 0.01 },
    ];

    function getRandomMonth() {
        const random = Math.random();
        let cumulativeProbability = 0;
        for (const { month, probability } of probabilities) {
            cumulativeProbability += probability;
            if (random < cumulativeProbability) {
                return month;
            }
        }
    }

    function getRandomDay(start = 0) {
        return Math.floor(Math.random() * (30 - start)) + start;
    }

    for (let i = 0; i < amount; i++) {
        let month = getRandomMonth();
        let day = 1;
        if (month == 1) day = getRandomDay(new Date().getDate());
        else day = getRandomDay();
        let deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * month * 30 + 1000 * 60 * 60 * 24 * 30);
        deadline.setDate(day);

        let state;

        if (Math.random() < 0.9) {
            if (month == 1 && Math.random() > deadline.getDate() / 30) {
                state = Math.floor(Math.random() * 2);
            } else {
                state = 2;
            }
        } else {
            state = Math.floor(Math.random() * 3);
        }

        EIDs.push({
            EID: startingEID + i,
            ParentEID: 3,
            ETID: 2,
            name: 'Zlecenie' + (startingEID + i),
            DimensionsAndStructure_json: '{}',
        });
        OIDs.push({
            OID: startingOID + i,
            EID: startingEID + i,
            State: state,
            Priority: 1,
            deadline: deadline,
        });
    }

    return [EIDs, OIDs];
}

function generateAlerts(startingEID, amount) {
    let AIDs = [];
    for (let i = 0; i < amount; i++) {
        AIDs.push({
            EID: startingEID + i,
            date: new Date(Date.now() - 1000 * 60 * 30 + Math.floor(Math.random() * 1000 * 60 * 40)),
            State: Math.floor(Math.random() * 3),
            AAID: Math.floor(Math.random() * 2) == 0 ? 1 : 3,
        });
    }
    return [...AIDs];
}

module.exports = seed;

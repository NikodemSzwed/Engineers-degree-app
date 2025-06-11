const db = require('./db');
const bcrypt = require('bcryptjs');

const init = require('../models/init-models');
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
                name: 'Zlecenie1',
                DimensionsAndStructure_json: '{}',
            },
        ]);

        await Orders.bulkCreate([
            { OID: 1, EID: 16, State: 0, Priority: 1, deadline: new Date('2024-11-23 18:08:09') },
            { OID: 2, EID: 19, State: 0, Priority: 1, deadline: new Date('2024-11-23 18:12:39') },
        ]);

        await AlertsTypes.bulkCreate([
            { AAID: 1, name: 'Brak elementu' },
            { AAID: 2, name: 'Złe zlecenie na sektorze' },
            { AAID: 3, name: 'Inny problem' },
        ]);

        await Alerts.bulkCreate([
            { AAID: 1, EID: 16, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 2, EID: 3, State: 0, date: new Date('2024-11-23 18:12:39') },
            { AAID: 3, EID: 2, State: 0, date: new Date('2024-11-23 18:12:39') },
        ]);

        await ATtoETAssignment.bulkCreate([
            { AAID: 1, ETID: 2 },
            { AAID: 2, ETID: 3 },
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

module.exports = seed;

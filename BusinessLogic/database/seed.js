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
            {
                EID: 2,
                ParentEID: null,
                ETID: 1,
                name: 'Hala 1',
                DimensionsAndStructure_json:
                    '{"zones":[{"name":"zone A","coords":[[[1324.7047125744923,164.52750117624873],[1888.5524453153246,164.52750117624873],[1888.5524453153246,1042.2543626596894],[1324.7047125744923,1042.2543626596894],[1324.7047125744923,164.52750117624873]]]},{"name":"zone B","coords":[[[1324.7047125744923,1042.2543626596894],[760.887912978184,1042.2543626596894],[760.887912978184,383.5215616013253],[1041.2061371169789,164.52750117624873],[1324.7047125744923,164.52750117624873],[1324.7047125744923,1042.2543626596894]]]},{"name":"","coords":[[[587.0321959229742,992.8247360197445],[587.0321959229742,992.8247360197445],[587.0321959229742,992.8247360197445],[587.0321959229742,992.8247360197445],[587.0321959229742,992.8247360197445]]]},{"name":"zone W","coords":[[[1888.8799739193619,56.30152490504602],[1888.5524453153246,164.52750117624873],[1041.2061371169789,164.52750117624873],[760.887912978184,383.5215616013253],[760.887912978184,1042.2543626596894],[605.0042949137649,1042.2543626596894],[603.7610985318006,56.43765422460217],[1888.8799739193619,56.30152490504602]]]}]}',
            },
            {
                EID: 3,
                ParentEID: 2,
                ETID: 3,
                name: 'Załadunek',
                DimensionsAndStructure_json:
                    '[[[22.07496391486586,15.349232446912538],[291.24810852995597,15.349232446912538],[291.24810852995597,161.83537335757308],[22.07496391486586,161.83537335757308],[22.07496391486586,15.349232446912538]]]',
            },
            {
                EID: 4,
                ParentEID: 2,
                ETID: 3,
                name: 'Montaż',
                DimensionsAndStructure_json:
                    '[[[22.81172266063652,345.8566202012803],[563.233048445366,345.8566202012803],[563.233048445366,1058.2572182967713],[22.81172266063652,1058.2572182967713],[22.81172266063652,345.8566202012803]]]',
            },
            {
                EID: 5,
                ParentEID: 2,
                ETID: 3,
                name: 'Pakowanie',
                DimensionsAndStructure_json:
                    '[[[22.81172266063652,176.87547407063738],[564.8644053405468,176.87547407063738],[564.8644053405468,328.5416142275897],[22.81172266063652,328.5416142275897],[22.81172266063652,176.87547407063738]]]',
            },
            {
                EID: 6,
                ParentEID: 2,
                ETID: 3,
                name: 'A1',
                DimensionsAndStructure_json:
                    '[[[1340.3874136612603,176.92612136873413],[1550.0172740560042,176.92612136873413],[1550.0172740560042,389.4414957695327],[1340.3874136612603,389.4414957695327],[1340.3874136612603,176.92612136873413]]]',
            },
            {
                EID: 7,
                ParentEID: 2,
                ETID: 3,
                name: 'A8',
                DimensionsAndStructure_json:
                    '[[[1665.061893135146,814.7818235400706],[1874.6331412241134,814.7818235400706],[1874.6331412241134,1027.160142817353],[1665.061893135146,1027.160142817353],[1665.061893135146,814.7818235400706]]]',
            },
            {
                EID: 8,
                ParentEID: 2,
                ETID: 3,
                name: 'A7',
                DimensionsAndStructure_json:
                    '[[[1340.3874136612603,814.4475916343172],[1549.879843067346,814.4475916343172],[1549.879843067346,1026.9225526032596],[1340.3874136612603,1026.9225526032596],[1340.3874136612603,814.4475916343172]]]',
            },
            {
                EID: 9,
                ParentEID: 2,
                ETID: 3,
                name: 'A4',
                DimensionsAndStructure_json:
                    '[[[1665.061893135146,389.84020028037264],[1874.5958790009147,389.84020028037264],[1874.5958790009147,602.2834067490597],[1665.061893135146,602.2834067490597],[1665.061893135146,389.84020028037264]]]',
            },
            {
                EID: 10,
                ParentEID: 2,
                ETID: 3,
                name: 'A6',
                DimensionsAndStructure_json:
                    '[[[1665.061893135146,602.2834067490597],[1874.6550930909395,602.2834067490597],[1874.6550930909395,814.7818235400706],[1665.061893135146,814.7818235400706],[1665.061893135146,602.2834067490597]]]',
            },
            {
                EID: 11,
                ParentEID: 2,
                ETID: 3,
                name: 'A3',
                DimensionsAndStructure_json:
                    '[[[1340.3874136612603,389.4414957695327],[1549.995312601497,389.4414957695327],[1549.995312601497,601.9404370833988],[1340.3874136612603,601.9404370833988],[1340.3874136612603,389.4414957695327]]]',
            },
            {
                EID: 12,
                ParentEID: 2,
                ETID: 3,
                name: 'A5',
                DimensionsAndStructure_json:
                    '[[[1340.3874136612603,601.9404370833988],[1550.0075461513056,601.9404370833988],[1550.0075461513056,814.4475916343172],[1340.3874136612603,814.4475916343172],[1340.3874136612603,601.9404370833988]]]',
            },
            {
                EID: 13,
                ParentEID: 2,
                ETID: 3,
                name: 'A2',
                DimensionsAndStructure_json:
                    '[[[1665.061893135146,177.3394172360904],[1874.6355444049955,177.3394172360904],[1874.6355444049955,389.84020028037264],[1665.061893135146,389.84020028037264],[1665.061893135146,177.3394172360904]]]',
            },
            {
                EID: 14,
                ParentEID: 2,
                ETID: 3,
                name: 'B10',
                DimensionsAndStructure_json:
                    '[[[776.3595181964834,826.4003772857926],[986.9669257346309,826.4003772857926],[986.9669257346309,926.4003772857901],[776.3595181964834,926.4003772857901],[776.3595181964834,826.4003772857926]]]',
            },
            {
                EID: 15,
                ParentEID: 2,
                ETID: 3,
                name: 'B11',
                DimensionsAndStructure_json:
                    '[[[776.3595181964834,926.4003772857901],[986.9669257346313,926.4003772857901],[986.9669257346313,1026.4003772857861],[776.3595181964834,1026.4003772857861],[776.3595181964834,926.4003772857901]]]',
            },
            {
                EID: 16,
                ParentEID: 2,
                ETID: 3,
                name: 'B8',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,826.4003772857911],[1309.2388946010078,826.4003772857911],[1309.2388946010078,926.4003772857886],[1098.6314870628587,926.4003772857886],[1098.6314870628587,826.4003772857911]]]',
            },
            {
                EID: 17,
                ParentEID: 2,
                ETID: 3,
                name: 'B5',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,626.4003772857961],[1309.2388946010078,626.4003772857961],[1309.2388946010078,726.4003772857936],[1098.6314870628587,726.4003772857936],[1098.6314870628587,626.4003772857961]]]',
            },
            {
                EID: 18,
                ParentEID: 2,
                ETID: 3,
                name: 'B9',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,926.4003772857886],[1309.2388946010078,926.4003772857886],[1309.2388946010078,1026.4003772857861],[1098.6314870628587,1026.4003772857861],[1098.6314870628587,926.4003772857886]]]',
            },
            {
                EID: 19,
                ParentEID: 2,
                ETID: 3,
                name: 'B7',
                DimensionsAndStructure_json:
                    '[[[776.3595181964834,626.4003772857976],[986.9669257346326,626.4003772857976],[986.9669257346326,726.4003772857951],[776.3595181964834,726.4003772857951],[776.3595181964834,626.4003772857976]]]',
            },
            {
                EID: 20,
                ParentEID: 2,
                ETID: 3,
                name: 'B2',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,326.40037728580364],[1309.2388946010078,326.40037728580364],[1309.2388946010078,426.40037728580114],[1098.6314870628587,426.40037728580114],[1098.6314870628587,326.40037728580364]]]',
            },
            {
                EID: 21,
                ParentEID: 2,
                ETID: 3,
                name: 'B4',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,526.4003772857986],[1309.2388946010078,526.4003772857986],[1309.2388946010078,626.4003772857961],[1098.6314870628587,626.4003772857961],[1098.6314870628587,526.4003772857986]]]',
            },
            {
                EID: 22,
                ParentEID: 2,
                ETID: 3,
                name: 'B6',
                DimensionsAndStructure_json:
                    '[[[776.3595181964834,526.4003772858001],[986.9669257346327,526.4003772858001],[986.9669257346327,626.4003772857976],[776.3595181964834,626.4003772857976],[776.3595181964834,526.4003772858001]]]',
            },
            {
                EID: 23,
                ParentEID: 2,
                ETID: 3,
                name: 'B1',
                DimensionsAndStructure_json:
                    '[[[776.3595181964834,426.4003772858026],[776.3595181964834,388.1853051531257],[986.9669257346326,226.40037728580762],[986.9669257346327,426.4003772858026],[776.3595181964834,426.4003772858026]]]',
            },
            {
                EID: 24,
                ParentEID: 2,
                ETID: 3,
                name: 'B3',
                DimensionsAndStructure_json:
                    '[[[1098.6314870628587,226.40037728580614],[1309.2388946010078,226.40037728580614],[1309.2388946010078,326.40037728580364],[1098.6314870628587,326.40037728580364],[1098.6314870628587,226.40037728580614]]]',
            },
            {
                EID: 25,
                ParentEID: 2,
                ETID: 3,
                name: 'Rozładunek',
                DimensionsAndStructure_json:
                    '[[[291.24810852995597,15.349232446912765],[560.4273930310272,15.349232446912765],[560.4273930310272,161.83537335757308],[291.24810852995597,161.83537335757308],[291.24810852995597,15.349232446912765]]]',
            },
            { EID: 26, ParentEID: null, ETID: 1, name: 'Hala 9', DimensionsAndStructure_json: '{}' },
            { EID: 27, ParentEID: 26, ETID: 3, name: 'Sektor 4', DimensionsAndStructure_json: '{}' },
            {
                EID: 28,
                ParentEID: 3,
                ETID: 2,
                name: 'Zlecenie1',
                DimensionsAndStructure_json: '{}',
            },
            {
                EID: 29,
                ParentEID: 3,
                ETID: 2,
                name: 'Zlecenie2',
                DimensionsAndStructure_json: '{}',
            },
            { EID: 30, ParentEID: 3, ETID: 2, name: 'Zlecenie3', DimensionsAndStructure_json: '{}' },
            { EID: 31, ParentEID: 3, ETID: 2, name: 'Zlecenie4', DimensionsAndStructure_json: '{}' },
            { EID: 32, ParentEID: 3, ETID: 2, name: 'Zlecenie5', DimensionsAndStructure_json: '{}' },
            { EID: 33, ParentEID: 3, ETID: 2, name: 'Zlecenie6', DimensionsAndStructure_json: '{}' },
            { EID: 34, ParentEID: 3, ETID: 2, name: 'Zlecenie7', DimensionsAndStructure_json: '{}' },
            { EID: 35, ParentEID: 3, ETID: 2, name: 'Zlecenie8', DimensionsAndStructure_json: '{}' },
        ]);

        await Orders.bulkCreate([
            { OID: 1, EID: 28, State: 0, Priority: 1, deadline: new Date('2025-06-23 18:08:09') },
            { OID: 2, EID: 29, State: 0, Priority: 1, deadline: new Date('2025-07-23 18:12:39') },
            { OID: 3, EID: 30, State: 1, Priority: 1, deadline: new Date('2025-06-23 18:08:09') },
            { OID: 4, EID: 31, State: 1, Priority: 1, deadline: new Date('2025-05-23 18:12:39') },
            { OID: 5, EID: 32, State: 2, Priority: 1, deadline: new Date('2025-04-23 18:08:09') },
            { OID: 6, EID: 33, State: 2, Priority: 1, deadline: new Date('2025-03-23 18:12:39') },
            { OID: 7, EID: 34, State: 1, Priority: 1, deadline: new Date('2025-02-23 18:08:09') },
            { OID: 8, EID: 35, State: 1, Priority: 1, deadline: new Date('2025-03-23 18:12:39') },
        ]);

        let orders = generateOrders(9, 36, 1000);
        // await MapsAndElements.bulkCreate(orders[0]);
        // await Orders.bulkCreate(orders[1]);

        await AlertsTypes.bulkCreate([
            { AAID: 1, name: 'Brak elementu' },
            { AAID: 2, name: 'Złe zlecenie na sektorze' },
            { AAID: 3, name: 'Inny problem' },
        ]);

        await Alerts.bulkCreate([
            { AAID: 1, EID: 28, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 28, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 28, State: 0, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 28, State: 1, date: new Date('2024-11-23 18:08:09') },
            { AAID: 1, EID: 28, State: 1, date: new Date('2024-11-23 18:08:09') },
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
            { DEAID: 4, DID: 2, EID: 2 },
            { DEAID: 5, DID: 2, EID: 26 },
        ]);

        await Groups.bulkCreate([
            { GID: 1, name: 'Administrators', allowMapEdit: 1 },
            { GID: 2, name: 'Kierownik Hala 9', allowMapEdit: 0 },
        ]);

        await MapsToGroupAssignment.bulkCreate([
            { GID: 1, EID: 2 },
            { GID: 1, EID: 26 },
            { GID: 2, EID: 26 },
        ]);

        let color = 'green';
        await Users.bulkCreate([
            {
                login: 'Administrator',
                email: 'tak@wp.pl',
                passwd: bcrypt.hashSync('ZAQ12wsx@#', 10),
                PersonalSettings_json: `{"primaryColor":{"50":"{${color}.50}","100":"{${color}.100}","200":"{${color}.200}","300":"{${color}.300}","400":"{${color}.400}","500":"{${color}.500}","600":"{${color}.600}","700":"{${color}.700}","800":"{${color}.800}","900":"{${color}.900}","950":"{${color}.950}"},"darkMode":true,"history":["/alerts","/orders","/maps","/displays"]}`,
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

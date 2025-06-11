const db = require('./db');
const init = require('../models/init-models');

function getModels() {
    // Modele zwracane w postaci
    // {
    //     ATtoETAssignment,
    //     Alerts,
    //     AlertsTypes,
    //     Deliveries,
    //     DisplayElementsAssignment,
    //     Displays,
    //     ElementsTypes,
    //     Groups,
    //     MapsAndElements,
    //     MapsToGroupAssignment,
    //     Membership,
    //     Orders,
    //     Users
    // }
    return init(db);
}

module.exports = getModels;

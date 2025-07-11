var DataTypes = require('sequelize').DataTypes;
var _ATtoETAssignment = require('./ATtoETAssignment');
var _Alerts = require('./Alerts');
var _AlertsTypes = require('./AlertsTypes');
var _Deliveries = require('./Deliveries');
var _DisplayElementsAssignment = require('./DisplayElementsAssignment');
var _Displays = require('./Displays');
var _ElementsTypes = require('./ElementsTypes');
var _Groups = require('./Groups');
var _MapsAndElements = require('./MapsAndElements');
var _MapsToGroupAssignment = require('./MapsToGroupAssignment');
var _Membership = require('./Membership');
var _Orders = require('./Orders');
var _Users = require('./Users');

function initModels(sequelize) {
    var ATtoETAssignment = _ATtoETAssignment(sequelize, DataTypes);
    var Alerts = _Alerts(sequelize, DataTypes);
    var AlertsTypes = _AlertsTypes(sequelize, DataTypes);
    var Deliveries = _Deliveries(sequelize, DataTypes);
    var DisplayElementsAssignment = _DisplayElementsAssignment(sequelize, DataTypes);
    var Displays = _Displays(sequelize, DataTypes);
    var ElementsTypes = _ElementsTypes(sequelize, DataTypes);
    var Groups = _Groups(sequelize, DataTypes);
    var MapsAndElements = _MapsAndElements(sequelize, DataTypes);
    var MapsToGroupAssignment = _MapsToGroupAssignment(sequelize, DataTypes);
    var Membership = _Membership(sequelize, DataTypes);
    var Orders = _Orders(sequelize, DataTypes);
    var Users = _Users(sequelize, DataTypes);

    // ATtoETAssignment.belongsTo(AlertsTypes, { as: "AA", foreignKey: "AAID", onDelete: "CASCADE"});
    // AlertsTypes.hasMany(ATtoETAssignment, { as: "ATtoETAssignments", foreignKey: "AAID"});
    Alerts.belongsTo(AlertsTypes, {
        as: 'AA_AlertsTypes',
        foreignKey: 'AAID',
        onDelete: 'CASCADE',
    });
    AlertsTypes.hasMany(Alerts, { foreignKey: 'AAID' });
    DisplayElementsAssignment.belongsTo(Displays, {
        as: 'DID_Display',
        foreignKey: 'DID',
        onDelete: 'CASCADE',
    });
    Displays.hasMany(DisplayElementsAssignment, {
        as: 'DisplayElementsAssignments',
        foreignKey: 'DID',
    });
    // ATtoETAssignment.belongsTo(ElementsTypes, { as: "ET", foreignKey: "ETID", onDelete: "CASCADE"});
    // ElementsTypes.hasMany(ATtoETAssignment, { as: "ATtoETAssignments", foreignKey: "ETID"});
    MapsAndElements.belongsTo(ElementsTypes, { as: 'ET', foreignKey: 'ETID', onDelete: 'CASCADE' });
    ElementsTypes.hasMany(MapsAndElements, { as: 'MapsAndElements', foreignKey: 'ETID' });
    // MapsToGroupAssignment.belongsTo(Groups, { as: "GID_Group", foreignKey: "GID", onDelete: "CASCADE"});
    // Groups.hasMany(MapsToGroupAssignment, { as: "MapsToGroupAssignments", foreignKey: "GID"});
    // Membership.belongsTo(Groups, { as: "GID_Group", foreignKey: "GID", onDelete: "CASCADE"});
    // Groups.hasMany(Membership, { as: "Memberships", foreignKey: "GID"});
    Alerts.belongsTo(MapsAndElements, {
        as: 'EID_MapsAndElement',
        foreignKey: 'EID',
        onDelete: 'CASCADE',
    });
    MapsAndElements.hasMany(Alerts, { foreignKey: 'EID' });
    // DisplayElementsAssignment.belongsTo(MapsAndElements, { as: "EID_MapsAndElement", foreignKey: "EID", onDelete: "CASCADE"});
    // MapsAndElements.hasMany(DisplayElementsAssignment, { as: "DisplayElementsAssignments", foreignKey: "EID"});
    MapsAndElements.belongsTo(MapsAndElements, {
        as: 'ParentE',
        foreignKey: 'ParentEID',
        onDelete: 'CASCADE',
    });
    MapsAndElements.hasMany(MapsAndElements, { as: 'MapsAndElements', foreignKey: 'ParentEID' });
    // MapsToGroupAssignment.belongsTo(MapsAndElements, { as: "EID_MapsAndElement", foreignKey: "EID", onDelete: "CASCADE"});
    // MapsAndElements.hasMany(MapsToGroupAssignment, { as: "MapsToGroupAssignments", foreignKey: "EID"});
    Orders.belongsTo(MapsAndElements, {
        as: 'EID_MapsAndElement',
        foreignKey: 'EID',
        onDelete: 'CASCADE',
    });
    MapsAndElements.hasMany(Orders, { as: 'Orders', foreignKey: 'EID' });
    Deliveries.belongsTo(Orders, { foreignKey: 'OID', onDelete: 'CASCADE' });
    Orders.hasMany(Deliveries, { foreignKey: 'OID' });
    // Membership.belongsTo(Users, { as: "UID_User", foreignKey: "UID", onDelete: "CASCADE"});
    // Users.hasMany(Membership, { as: "Memberships", foreignKey: "UID"});

    Users.belongsToMany(Groups, { through: Membership, foreignKey: 'UID', onDelete: 'CASCADE' });
    Groups.belongsToMany(Users, { through: Membership, foreignKey: 'GID', onDelete: 'CASCADE' });
    Groups.belongsToMany(MapsAndElements, {
        through: MapsToGroupAssignment,
        foreignKey: 'GID',
        onDelete: 'CASCADE',
    });
    MapsAndElements.belongsToMany(Groups, {
        through: MapsToGroupAssignment,
        foreignKey: 'EID',
        onDelete: 'CASCADE',
    });
    Displays.belongsToMany(MapsAndElements, {
        through: DisplayElementsAssignment,
        foreignKey: 'DID',
        onDelete: 'CASCADE',
    });
    MapsAndElements.belongsToMany(Displays, {
        through: DisplayElementsAssignment,
        foreignKey: 'EID',
        onDelete: 'CASCADE',
    });
    AlertsTypes.belongsToMany(ElementsTypes, {
        through: ATtoETAssignment,
        foreignKey: 'AAID',
        onDelete: 'CASCADE',
    });
    ElementsTypes.belongsToMany(AlertsTypes, {
        through: ATtoETAssignment,
        foreignKey: 'ETID',
        onDelete: 'CASCADE',
    });

    // MapsAndElements.belongsTo(MapsAndElements, { as: "parentElement", foreignKey: "ParentEID", onDelete: "CASCADE"});
    // MapsAndElements.hasMany(MapsAndElements, { as: 's', foreignKey: 'ParentEID' });
    // MapsAndElements.hasMany(MapsAndElements, { as: 'o', foreignKey: 'ParentEID' });
    // MapsAndElements.belongsTo(MapsAndElements, { as: "orders", foreignKey: "ParentEID", onDelete: "CASCADE"});

    return {
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
    };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;

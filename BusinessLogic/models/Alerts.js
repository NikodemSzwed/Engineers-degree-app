const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Alerts',
        {
            AID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            AAID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'AlertsTypes',
                    key: 'AAID',
                },
            },
            EID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'MapsAndElements',
                    key: 'EID',
                },
            },
            State: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.fn('current_timestamp'),
            },
        },
        {
            sequelize,
            tableName: 'Alerts',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'AID' }],
                },
                {
                    name: 'AAID',
                    using: 'BTREE',
                    fields: [{ name: 'AAID' }],
                },
                {
                    name: 'EID',
                    using: 'BTREE',
                    fields: [{ name: 'EID' }],
                },
            ],
        }
    );
};

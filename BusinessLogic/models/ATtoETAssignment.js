const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'ATtoETAssignment',
        {
            ATTETAID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            ETID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'ElementsTypes',
                    key: 'ETID',
                },
            },
            AAID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'AlertsTypes',
                    key: 'AAID',
                },
            },
        },
        {
            sequelize,
            tableName: 'ATtoETAssignment',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'ATTETAID' }],
                },
                {
                    name: 'ETID',
                    using: 'BTREE',
                    fields: [{ name: 'ETID' }],
                },
                {
                    name: 'AAID',
                    using: 'BTREE',
                    fields: [{ name: 'AAID' }],
                },
            ],
        }
    );
};

const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'MapsToGroupAssignment',
        {
            MGAID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            GID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Groups',
                    key: 'GID',
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
        },
        {
            sequelize,
            tableName: 'MapsToGroupAssignment',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'MGAID' }],
                },
                {
                    name: 'GID',
                    using: 'BTREE',
                    fields: [{ name: 'GID' }],
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

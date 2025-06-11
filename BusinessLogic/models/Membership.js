const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Membership',
        {
            MemID: {
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
            UID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'UID',
                },
            },
        },
        {
            sequelize,
            tableName: 'Membership',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'MemID' }],
                },
                {
                    name: 'GID',
                    using: 'BTREE',
                    fields: [{ name: 'GID' }],
                },
                {
                    name: 'UID',
                    using: 'BTREE',
                    fields: [{ name: 'UID' }],
                },
            ],
        }
    );
};

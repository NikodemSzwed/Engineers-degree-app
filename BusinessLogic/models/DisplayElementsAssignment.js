const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'DisplayElementsAssignment',
        {
            DEAID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            DID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Displays',
                    key: 'DID',
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
            tableName: 'DisplayElementsAssignment',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'DEAID' }],
                },
                {
                    name: 'DID',
                    using: 'BTREE',
                    fields: [{ name: 'DID' }],
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

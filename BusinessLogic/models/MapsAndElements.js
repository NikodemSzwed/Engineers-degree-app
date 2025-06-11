const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'MapsAndElements',
        {
            EID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            ParentEID: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: 'MapsAndElements',
                    key: 'EID',
                },
            },
            ETID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'ElementsTypes',
                    key: 'ETID',
                },
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            DimensionsAndStructure_json: {
                type: DataTypes.TEXT,
                defaultValue: '{}',
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'MapsAndElements',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'EID' }],
                },
                {
                    name: 'ETID',
                    using: 'BTREE',
                    fields: [{ name: 'ETID' }],
                },
                {
                    name: 'ParentEID',
                    using: 'BTREE',
                    fields: [{ name: 'ParentEID' }],
                },
            ],
        }
    );
};

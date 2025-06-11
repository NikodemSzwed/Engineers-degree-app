const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Orders',
        {
            OID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
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
            },
            Priority: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1,
            },
            deadline: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'Orders',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'OID' }],
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

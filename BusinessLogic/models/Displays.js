const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Displays',
        {
            DID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            UUID: {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            validated: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            tableName: 'Displays',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'DID' }],
                },
            ],
        }
    );
};

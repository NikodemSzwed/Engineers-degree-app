const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Groups',
        {
            GID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            allowMapEdit: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            tableName: 'Groups',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'GID' }],
                },
            ],
        }
    );
};

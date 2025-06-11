const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Deliveries',
        {
            DelivID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            OID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Orders',
                    key: 'OID',
                },
            },
            date: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.fn('current_timestamp'),
            },
        },
        {
            sequelize,
            tableName: 'Deliveries',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'DelivID' }],
                },
                {
                    name: 'OID',
                    using: 'BTREE',
                    fields: [{ name: 'OID' }],
                },
            ],
        }
    );
};

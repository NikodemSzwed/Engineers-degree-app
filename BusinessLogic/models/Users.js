const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        'Users',
        {
            UID: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            login: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            passwd: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            email: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            PersonalSettings_json: {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: '{}',
            },
        },
        {
            sequelize,
            tableName: 'Users',
            timestamps: false,
            indexes: [
                {
                    name: 'PRIMARY',
                    unique: true,
                    using: 'BTREE',
                    fields: [{ name: 'UID' }],
                },
            ],
        }
    );
};

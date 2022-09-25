"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PriceRanges", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      range_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      range_from: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        unique: true,
      },
      range_to: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PriceRanges");
  },
};

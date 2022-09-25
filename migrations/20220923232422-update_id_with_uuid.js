"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("RolePermissions", "role_id", {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    });
    await queryInterface.changeColumn("RolePermissions", "perm_id", {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("RolePermissions");
  },
};

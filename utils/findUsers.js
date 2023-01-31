const { sequelize, User } = require("../models");
const { QueryTypes } = require("sequelize");
module.exports = {
  getAllEnginnerEmailList: async () => {
    try {
      const emails = await sequelize.query(
        "select email from users where role_id in(select a.id from roles as a " +
          "inner join rolepermissions as ro on a.id = ro.role_id " +
          "inner join permissions as p on ro.perm_id = p.id " +
          "where p.perm_name = 'is_enginner')",
        {
          type: QueryTypes.SELECT,
        }
      );
      return emails;
    } catch (error) {
      return [];
    }
  },
  getAllNonAdminUserIds: async (t, target) => {
    let queryName = "!= 'can_access_dashboard'";
    if (target === "engineer") {
      queryName = "= 'is_enginner'";
    }

    if (target === "owner") {
      queryName = "= 'is_project_owner'";
    }
    const userIds = await sequelize.query(
      "select id from users where role_id in(select a.id from roles as a " +
        "inner join rolepermissions as ro on a.id = ro.role_id " +
        "inner join permissions as p on ro.perm_id = p.id " +
        `where p.perm_name ${queryName})`,
      {
        type: QueryTypes.SELECT,
        model: User,
        mapToModel: true,
      },
      { transaction: t }
    );
    return userIds;
  },
};

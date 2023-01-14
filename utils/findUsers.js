const { sequelize } = require("../models");
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
};

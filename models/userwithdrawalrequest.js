"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserWithdrawalRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserWithdrawalRequest.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User",
      });
    }
  }
  UserWithdrawalRequest.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      accepted: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: "UserWithdrawalRequest",
    }
  );
  return UserWithdrawalRequest;
};

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
      });
      UserWithdrawalRequest.hasMany(models.UserCreditCardRequest, {
        foreignKey: "withdraw_id",
        as: "creditcard",
      });
      UserWithdrawalRequest.hasMany(models.UserPaypalRequest, {
        foreignKey: "withdraw_id",
        as: "paypal",
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
      amount: {
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
      attachment: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "UserWithdrawalRequest",
    }
  );
  return UserWithdrawalRequest;
};

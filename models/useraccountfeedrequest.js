"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserAccountFeedRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserAccountFeedRequest.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  UserAccountFeedRequest.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      attachment: {
        type: DataTypes.STRING,
      },
      accepted: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "UserAccountFeedRequest",
    }
  );
  return UserAccountFeedRequest;
};

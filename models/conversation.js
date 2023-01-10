"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Conversation.belongsTo(models.User, {
        foreignKey: "sender_id",
      });
      Conversation.belongsTo(models.User, {
        foreignKey: "receiver_id",
      });
    }
  }
  Conversation.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      sender_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        // references: {
        //   model: "users",
        //   key: "id",
        // },
      },
      receiver_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        // references: {
        //   model: "users",
        //   key: "id",
        // },
      },
      message: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Conversation",
    }
  );
  return Conversation;
};

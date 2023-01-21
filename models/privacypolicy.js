"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PrivacyPolicy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PrivacyPolicy.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      description: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PrivacyPolicy",
    }
  );
  return PrivacyPolicy;
};

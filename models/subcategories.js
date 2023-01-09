"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SubCategories extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SubCategories.belongsTo(models.Category, {
        foreignKey: "cat_id",
      });
      SubCategories.hasMany(models.Project, {
        foreignKey: "category_id",
        as: "projects",
      });
    }
  }
  SubCategories.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cat_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SubCategories",
    }
  );
  return SubCategories;
};

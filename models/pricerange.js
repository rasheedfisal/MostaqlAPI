"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PriceRange extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PriceRange.hasMany(models.Project, {
        foreignKey: "price_range_id",
        as: "projects",
      });
    }
  }
  PriceRange.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      range_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      range_from: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        unique: true,
      },
      range_to: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "PriceRange",
    }
  );
  return PriceRange;
};

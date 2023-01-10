"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserReviews extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserReviews.belongsTo(models.User, {
        foreignKey: "owner_id",
      });
      UserReviews.belongsTo(models.User, {
        foreignKey: "talent_id",
      });
      UserReviews.belongsTo(models.Project, {
        foreignKey: "proj_id",
      });
    }
  }
  UserReviews.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      talent_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      comment: { type: DataTypes.TEXT("long"), allowNull: false },
      star_rate: { type: DataTypes.FLOAT, allowNull: false },
      proj_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "UserReviews",
    }
  );
  return UserReviews;
};

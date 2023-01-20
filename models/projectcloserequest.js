"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProjectCloseRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProjectCloseRequest.belongsTo(models.Project, {
        foreignKey: "proj_id",
        as: "ownerProject",
      });
    }
  }
  ProjectCloseRequest.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      reason: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      proj_id: {
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
      modelName: "ProjectCloseRequest",
    }
  );
  return ProjectCloseRequest;
};

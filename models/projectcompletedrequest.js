"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProjectCompletedRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProjectCompletedRequest.belongsTo(models.Project, {
        foreignKey: "proj_id",
        as: "ownerProject",
      });
      ProjectCompletedRequest.belongsTo(models.ProjectOffer, {
        foreignKey: "offer_id",
        as: "winning_offer",
      });
    }
  }
  ProjectCompletedRequest.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      proj_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      offer_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      approved: DataTypes.BOOLEAN,
      is_transfered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProjectCompletedRequest",
    }
  );
  return ProjectCompletedRequest;
};

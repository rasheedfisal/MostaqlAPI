"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProjectOffer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProjectOffer.belongsTo(models.Project, {
        foreignKey: "proj_id",
      });
      ProjectOffer.belongsTo(models.User, {
        foreignKey: "user_offered_id",
        as: "client",
      });
      ProjectOffer.belongsTo(models.CommissionRate, {
        foreignKey: "rate_id",
        as: "commissionRate",
      });
    }
  }
  ProjectOffer.init(
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
      user_offered_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      days_to_deliver: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message_desc: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      pdf_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rate_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
    },
    // {
    //   indexes: [
    //     {
    //       unique: true,
    //       fields: ["user_offered_id", "proj_id"],
    //     },
    //   ],
    // },
    {
      sequelize,
      modelName: "ProjectOffer",
    }
  );
  return ProjectOffer;
};

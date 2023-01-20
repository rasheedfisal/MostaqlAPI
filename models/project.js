"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Project.hasMany(models.ProjectOffer);
      Project.hasMany(models.ProjectOffer, {
        foreignKey: "proj_id",
        as: "projectoffers",
      });
      Project.belongsTo(models.User, {
        foreignKey: "user_added_id",
        as: "owner",
      });
      Project.belongsTo(models.PriceRange, {
        foreignKey: "price_range_id",
      });
      Project.belongsTo(models.ProjStatus, {
        foreignKey: "proj_status_id",
      });
      Project.belongsTo(models.SubCategories, {
        foreignKey: "category_id",
      });
      Project.hasMany(models.UserReviews, {
        foreignKey: "proj_id",
        as: "review_project",
      });
      Project.hasMany(models.ProjectCloseRequest, {
        foreignKey: "proj_id",
        as: "closeRequest",
      });
    }
  }
  Project.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_added_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      proj_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      proj_description: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      price_range_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      proj_period: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      attatchment_file: DataTypes.STRING,
      proj_status_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      skills: {
        type: DataTypes.TEXT("long"),
      },
      // IsOffered: {
      //   type: new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ["id"]),
      //   get: function () {
      //     const user_logged_in = this.query.request.user.id;
      //     sequelize.models.ProjectOffer.findOne({
      //       where: {
      //         user_offered_id: user_logged_in,
      //         proj_id: this.get("id"),
      //       },
      //     }).then((offer) => {
      //       if (!offer) {
      //         return false;
      //       }
      //       return true;
      //     });
      //   },
      // },
    },
    {
      sequelize,
      modelName: "Project",
    }
  );
  return Project;
};

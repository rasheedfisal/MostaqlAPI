"use strict";
const { Model, Sequelize } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsToMany(models.Notification, {
        through: "ReadNotification",
        as: "notificationReceivers",
        foreignKey: "receiver_id",
      });
      User.hasMany(models.Project, {
        foreignKey: "user_added_id",
        as: "projects",
      });
      User.hasOne(models.UserProfile, {
        foreignKey: "user_id",
        as: "userprofiles",
      });
      User.hasMany(models.ProjectOffer, {
        foreignKey: "user_offered_id",
        as: "projectoffers",
      });
      User.hasMany(models.Conversation, {
        foreignKey: "sender_id",
        as: "sender",
      });
      User.hasMany(models.Conversation, {
        foreignKey: "receiver_id",
        as: "receiver",
      });
      User.hasMany(models.Portfolio, {
        foreignKey: "user_id",
        as: "userportfolio",
      });
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
      });
      User.hasOne(models.UserCredentials, {
        foreignKey: "user_id",
        as: "usercredentials",
      });
      User.hasMany(models.UserSkills, {
        foreignKey: "user_id",
        as: "userskills",
      });
      User.hasMany(models.UserReviews, {
        foreignKey: "owner_id",
        as: "ownerreview",
      });
      User.hasMany(models.UserReviews, {
        foreignKey: "talent_id",
        as: "talentreview",
      });
      User.hasOne(models.ResetPassword, {
        foreignKey: "user_id",
        as: "resetuser",
      });
      User.hasMany(models.SupportBox, {
        foreignKey: "user_id",
        as: "Support",
      });
      User.hasMany(models.Notification, {
        foreignKey: "sender_id",
        as: "userNotification",
      });
      User.hasMany(models.UserWithdrawalRequest, {
        foreignKey: "user_id",
        as: "withdrawals",
      });
      User.hasOne(models.UserWallet, {
        foreignKey: "user_id",
        as: "wallet",
      });
      User.hasMany(models.UserAccountFeedRequest, {
        foreignKey: "user_id",
        as: "accountfeed",
      });
      User.hasMany(models.Transactions, {
        foreignKey: "beneficiary_id",
        as: "beneficiary",
      });
      User.hasMany(models.Transactions, {
        foreignKey: "user_id",
        as: "user",
      });

      //User.hasOne(models.Role);
    }
  }
  User.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imgPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  User.beforeSave(async (user, options) => {
    if (user.password) {
      user.password = bcrypt.hashSync(
        user.password,
        bcrypt.genSaltSync(10),
        null
      );
    }
  });
  User.prototype.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  };
  return User;
};

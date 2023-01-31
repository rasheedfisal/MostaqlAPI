const express = require("express");
const router = express.Router();
const {
  Notification,
  ReadNotification,
  User,
  sequelize,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const {
  bulkInsertReadNotifications,
} = require("../utils/readNotificationHelper");
const { handleForbidden, handleResponse } = require("../utils/handleError");
const { sendNotification } = require("../utils/advanceNotifier");

const helper = new Helper();

// Create a new Notification
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "notification_add");

      if (!req.body.description || !req.body.title || !req.body.target)
        return handleResponse(res, "Please pass Required Fields.", 400);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.

        const notification = await Notification.create(
          {
            title: req.body.title,
            description: req.body.description,
            type: "admin-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );

        if (
          req.body.target !== "engineer" &&
          req.body.target !== "owner" &&
          req.body.target !== "all"
        ) {
          await ReadNotification.create(
            {
              notification_id: notification.id,
              receiver_id: req.body.target,
            },
            { transaction: t }
          );
          const user = await User.findByPk(req.body.target);
          await sendNotification(
            req.body.title,
            req.body.description,
            user.email
          );
        } else {
          await bulkInsertReadNotifications(
            notification.id,
            req.body.target,
            t
          );
          const status =
            req.body.target === "all"
              ? "BOTH"
              : req.body.target === "engineer"
              ? "ENGINEER"
              : "OWNER";

          await sendNotification(req.body.title, req.body.description, status);
        }

        return handleResponse(res, "Resources Created Successfully", 201);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

module.exports = router;

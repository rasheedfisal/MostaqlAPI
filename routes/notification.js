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
const { getPagination, getPagingData } = require("../utils/pagination");
const { QueryTypes } = require("sequelize");

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

// Get All Notifications
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "notification_get_all");

      const { page, size } = req.query;
      const { limit, offset } = getPagination(page, size);

      // const notifications = await Notification.findAndCountAll({
      //   limit,
      //   offset,
      //   include: [
      //     {
      //       model: ReadNotification, // will create a left join
      //       as: "AllReadNotification",
      //       required: false,
      //       where: {
      //         [Op.or]: {
      //           "$Notification.sender_id$": req.user.id,
      //           "$AllReadNotification.receiver_id$": req.user.id,
      //         },
      //       },
      //     },
      //   ],
      //   distinct: true,
      //   order: [["createdAt", "desc"]],
      // });

      // const query =
      //   "select distinct a.*, u.email, u.fullname, u.imgPath, r.role_name, IFNULL(ro.read, true) as 'read', ro.receiver_id from Notifications as a " +
      //   "inner join users as u on a.sender_id = u.id " +
      //   "inner join roles as r on u.role_id = r.id " +
      //   "left join ReadNotifications as ro on a.id = ro.notification_id " +
      //   `where (a.sender_id = '${req.user.id}' or ro.receiver_id = '${req.user.id}') order by a.createdAt desc limit ${offset},${limit};`;

      const query =
        "select distinct a.*, u.email, u.fullname, u.imgPath, r.role_name, IFNULL(ro.read, true) as 'read', ro.receiver_id from Notifications as a " +
        "inner join users as u on u.id = a.sender_id " +
        "inner join roles as r on u.role_id = r.id " +
        "left join ReadNotifications as ro on a.id = ro.notification_id " +
        `where ro.receiver_id = '${req.user.id}' order by a.createdAt desc limit ${offset},${limit};`;

      const notifications = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        model: Notification,
        mapToModel: true, // pass true here if you have any mapped fields
        nest: true,
        raw: true,
      });

      const queryCount =
        "select distinct count(a.id) as count from Notifications as a " +
        "left join ReadNotifications as ro on a.id = ro.notification_id " +
        `where ro.receiver_id = '${req.user.id}' order by a.createdAt desc;`;
      const notificationsCount = await sequelize.query(queryCount, {
        type: QueryTypes.SELECT,
      });
      const pg = { count: notificationsCount[0].count, rows: notifications };
      return res.status(200).send(getPagingData(pg, page, limit));
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

// Update unread Notifications
router.put(
  "/unread/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      if (!req.params.id) {
        return handleResponse(res, "Please Add Required Field.");
      }
      await helper.checkPermission(
        req.user.role_id,
        "update_unread_notification"
      );

      await ReadNotification.update(
        {
          read: true,
        },
        {
          where: {
            notification_id: req.params.id,
            receiver_id: req.user.id,
          },
        }
      );
      return res.status(200).send({ msg: "Update Successfully" });
    } catch (error) {
      console.log(error);
      return handleForbidden(res, error);
    }
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  sequelize,
  UserWithdrawalRequest,
  UserAccountFeedRequest,
  UserCreditCardRequest,
  UserPaypalRequest,
  UserWallet,
  Notification,
  WithdrawableAmountSetting,
  User,
  Role,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const multer = require("multer");
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath, getNestedPath } = require("../utils/fileUrl");
const { QueryTypes } = require("sequelize");
const { sendNotification } = require("../utils/advanceNotifier");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") + "use_" + file.originalname
    );
  },
});

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

////////// feed account request ///////////////

// Create a new Feed Request
router.post(
  "/feed",
  upload.single("profileImage"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "feed_request_account_add")
      .then((rolePerm) => {
        if (!req.body.amount) {
          res.status(400).send({
            msg: "Please pass Role ID, email, password, phone or fullname.",
          });
        } else {
          let notify = {};
          sequelize
            .transaction((t) => {
              // chain all your queries here. make sure you return them.
              return UserAccountFeedRequest.create(
                {
                  user_id: req.user.id,
                  amount: req.body.amount,
                  attachment: req.file?.path,
                },
                { transaction: t }
              )
                .then((request) => {
                  return Notification.create(
                    {
                      title: "Account Feed Request",
                      description: `user ${req.user.fullname} is requesting to add money into his account based on the attachment he sent, please view the attachment below`,
                      type: "user-to-admin",
                      sender_id: req.user.id,
                    },
                    { transaction: t }
                  );
                })
                .then((notification) => {
                  notify = notification;
                  return sequelize.query(
                    "select id from users where role_id in(select a.id from roles as a " +
                      "inner join rolepermissions as ro on a.id = ro.role_id " +
                      "inner join permissions as p on ro.perm_id = p.id " +
                      "where p.perm_name = 'can_access_dashboard')",
                    {
                      type: QueryTypes.SELECT,
                      model: User,
                      mapToModel: true,
                    },
                    { transaction: t }
                  );
                })
                .then((users) => {
                  var promises = [];
                  users.map((a) => {
                    var newPromise = ReadNotification.create(
                      {
                        notification_id: notify.id,
                        receiver_id: a.id,
                      },
                      { transaction: t }
                    );
                    promises.push(newPromise);
                  });
                  return Promise.all(promises);
                });
            })
            .then((_) => {
              res.status(200).send({
                msg: "Resourse updated",
              });
            })
            .catch((err) => {
              res.status(500).send({
                msg: err,
              });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get All Account Feed
router.get(
  "/feed",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "feed_request_account_get_all")
      .then((rolePerm) => {
        UserAccountFeedRequest.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: User,
              include: {
                model: Role,
                attributes: ["role_name"],
              },
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get All Account Feed by User
router.get(
  "/feed/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "feed_request_account_get")
      .then((rolePerm) => {
        UserAccountFeedRequest.findAll({
          include: [
            {
              model: User,
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getPath(req, "imgPath"),
                "is_active",
                "createdAt",
              ],
              include: {
                model: Role,
                attributes: ["role_name"],
              },
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
          where: {
            user_id: req.user.id,
          },
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

module.exports = router;

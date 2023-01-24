const express = require("express");
const router = express.Router();
const {
  SupportBox,
  User,
  Notification,
  ReadNotification,
  Role,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");

// Create a new Support Box
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "support_box_add")
      .then((rolePerm) => {
        if (!req.body.type || !req.body.description || !req.body.user_id) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          let notify = {};
          sequelize
            .transaction((t) => {
              // chain all your queries here. make sure you return them.
              return SupportBox.create(
                {
                  type: req.body.type,
                  description: req.body.description,
                  user_id: req.user.id,
                },
                { transaction: t }
              )
                .then((support) => {
                  return Notification.create(
                    {
                      title: `User ${type}`,
                      description: `user ${req.user.fullname} has sent a ${type}`,
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
              res.status(201).send({
                msg: "Resourse created Successfully",
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({
                msg: err,
              });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({
          success: false,
          msg: error,
        });
      });
  }
);

// Get List of Support Boxes
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "support_box_get_all")
      .then((rolePerm) => {
        SupportBox.findAndCountAll({
          limit,
          offset,
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
              },
            },
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((supports) =>
            res.status(200).send(getPagingData(supports, page, limit))
          )
          .catch((error) => {
            res.status(500).send({
              success: false,
              msg: error,
            });
          });
      })
      .catch((error) => {
        res.status(403).send({
          success: false,
          msg: error,
        });
      });
  }
);

// Get Support by ID
router.get(
  "/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "support_box_get")
      .then((rolePerm) => {
        SupportBox.findByPk(req.user.id)
          .then((supports) => res.status(200).send(supports))
          .catch((error) => {
            res.status(400).send({
              success: false,
              msg: error,
            });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Resolve Support box issue
router.put(
  "/resolve/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "support_box_resolve")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass required fields.",
          });
        } else {
          SupportBox.findByPk(req.params.id)
            .then((request) => {
              if (request) {
                let reqUser = {};
                let notifiyUser = {};
                sequelize
                  .transaction((t) => {
                    // chain all your queries here. make sure you return them.
                    return SupportBox.update(
                      {
                        is_resolved: true,
                      },
                      {
                        where: {
                          id: req.params.id,
                        },
                      },
                      { transaction: t }
                    )
                      .then((_) => {
                        return sequelize.query(
                          "select * from users where id = (select user_id from supportboxes where id= :supportId)",
                          {
                            replacements: { supportId: req.params.id },
                            type: QueryTypes.SELECT,
                            model: User,
                            mapToModel: true,
                          },
                          { transaction: t }
                        );
                      })
                      .then((user) => {
                        reqUser = user[0];
                        return Notification.create(
                          {
                            title: `${request.type} Request`,
                            description: `hello ${user[0].fullname}, your ${request.type} was resolved`,
                            type: "admin-to-user",
                            sender_id: req.user.id,
                          },
                          { transaction: t }
                        );
                      })
                      .then((notify) => {
                        notifiyUser = notify;
                        return ReadNotification.create(
                          {
                            notification_id: notify.id,
                            receiver_id: reqUser.id,
                          },
                          { transaction: t }
                        );
                      });
                  })
                  .then((_) => {
                    sendNotification(
                      notifiyUser.title,
                      notifiyUser.description,
                      "test"
                    )
                      .then((_) => {
                        res.status(201).send({
                          msg: "Resourse updated Successfully",
                        });
                      })
                      .catch((_) => {
                        res.status(500).send({
                          msg: "the status has changed but the notification was not sent please resend from the notification page",
                        });
                      });
                  })
                  .catch((err) => {
                    res.status(500).send({
                      msg: err,
                    });
                  });
              } else {
                res.status(404).send({
                  msg: "Request not found",
                });
              }
            })
            .catch((error) => {
              res.status(500).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

module.exports = router;

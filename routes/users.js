const express = require("express");
const router = express.Router();
const {
  User,
  Role,
  Permission,
  UserCredentials,
  UserProfile,
  UserSkills,
  Portfolio,
  UserReviews,
  Project,
  UserWallet,
  ReadNotification,
  Notification,
} = require("../models");
const multer = require("multer");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const { Op } = require("sequelize");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath, getNestedPath } = require("../utils/fileUrl");
const { QueryTypes } = require("sequelize");
const db = require("../models");
const { sendToUserAuthorize } = require("../utils/advanceMailer");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const { sendNotification } = require("../utils/advanceNotifier");

const mergeUserPermissions = (permissions) => {
  let mergedPermission = [];
  for (let i = 0; i < permissions.length; i++) {
    mergedPermission.push(permissions[i].perm_name);
  }
  return mergedPermission;
};
const convertToUserInfoDto = (user) => {
  const stringfy = JSON.stringify(user);
  const authUser = JSON.parse(stringfy);
  const userInfoDto = {
    id: authUser.id,
    email: authUser.email,
    fullname: authUser.fullname,
    phone: authUser.phone,
    imgPath: authUser.imgPath, //base64_encode(user.imgPath),
    unreadCount: authUser.unread_count,
    permissions: mergeUserPermissions(authUser.Role.permissions),
  };
  return userInfoDto;
};

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
    file.mimetype === "image/jpg"
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

// Create a new User
router.post(
  "/",
  upload.single("profileImage"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_add")
      .then((rolePerm) => {
        if (
          !req.body.role_id ||
          !req.body.email ||
          !req.body.password ||
          !req.body.fullname ||
          !req.body.phone
        ) {
          res.status(400).send({
            msg: "Please pass Role ID, email, password, phone or fullname.",
          });
        } else {
          User.create({
            email: req.body.email,
            password: req.body.password,
            fullname: req.body.fullname,
            phone: req.body.phone,
            imgPath: req.file?.path,
            role_id: req.body.role_id,
          })
            .then((user) => res.status(201).send(user))
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get List of Users
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "user_get_all")
      .then((rolePerm) => {
        User.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: Role,
              include: [
                {
                  model: Permission,
                  as: "permissions",
                },
              ],
            },
          ],
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
            "is_active",
            "createdAt",
          ],
          //group: ["id"],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((users) => {
            //res.setHeader("x-total-count", users.count);
            res.status(200).send(getPagingData(users, page, limit));
          })
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get List of Credintial Users
router.get(
  "/credentials",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "user_get_all")
      .then((rolePerm) => {
        User.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: Role,
            },
            {
              model: UserCredentials,
              as: "usercredentials",
              required: true,
              attributes: ["id", getPath(req, "attachments"), "is_authorized"],
            },
          ],
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
            "is_active",
            "createdAt",
          ],
          //group: ["id"],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((users) => {
            //res.setHeader("x-total-count", users.count);
            res.status(200).send(getPagingData(users, page, limit));
          })
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get User by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_get")
      .then((rolePerm) => {
        User.findByPk(req.params.id, {
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
            "is_active",
          ],
          include: {
            model: Role,
            attributes: ["id", "role_name"],
          },
        })
          .then((user) => res.status(200).send(user))
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get User me
router.post(
  "/me",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_get")
      .then((rolePerm) => {
        User.findByPk(req.user.id, {
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
            "is_active",
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM readnotifications AS unread WHERE unread.receiver_id = '${req.user.id}' and unread.read=0)`
              ),
              "unread_count",
            ],
          ],
          include: [
            {
              model: Role,
              attributes: ["role_name"],
              nested: false,
              include: {
                model: Permission,
                as: "permissions",
                attributes: ["perm_name"],
                through: {
                  attributes: [],
                },
              },
            },
            // {
            //   model: UserProfile,
            //   attributes: ["perm_name"],
            // },
          ],
        })
          // .then((user) => res.status(200).send(user)) //
          .then((user) => res.status(200).send(convertToUserInfoDto(user))) //
          .catch((error) => {
            console.log(error);
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        console.log(error);
        res.status(403).send({ msg: error });
      });
  }
);
// show profile data By ID
router.post(
  "/show/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_get")
      .then((rolePerm) => {
        User.findByPk(req.params.id, {
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getNestedPath(req, "User.imgPath", "imgpath"),
            "is_active",
            [
              Sequelize.literal(
                `(SELECT (SELECT SUM(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = User.id) / (SELECT count(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = User.id))`
              ),
              "review_avg",
            ],
          ],
          include: [
            {
              model: UserProfile,
              as: "userprofiles",
              attributes: ["about_user", "specialization"],
            },
            {
              model: UserCredentials,
              as: "usercredentials",
              attributes: [getPath(req, "attachments"), "is_authorized"],
            },
            {
              model: UserSkills,
              as: "userskills",
              attributes: ["skill_name"],
            },
            {
              model: Portfolio,
              as: "userportfolio",
              attributes: [
                "title",
                "description",
                getNestedPath(req, "userportfolio.imgPath", "imgpath"),
                "url_link",
                "createdAt",
              ],
            },
            {
              model: UserWallet,
              as: "wallet",
            },
            {
              model: UserReviews,
              attributes: ["comment", "star_rate", "createdAt"],
              as: "talentreview",
              include: [
                {
                  model: User,
                  attributes: [
                    "id",
                    "email",
                    "fullname",
                    "phone",
                    getNestedPath(req, "talentreview.owner.imgPath", "imgpath"),
                  ],
                  as: "owner",
                },
                {
                  model: Project,
                  attributes: ["proj_title", "proj_description", "proj_period"],
                },
              ],
            },
          ],
        })
          .then((user) => res.status(200).send(user)) //
          .catch((error) => {
            console.error(error);
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(403).send({ msg: error });
      });
  }
);
// show profile data
router.post(
  "/show",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_get")
      .then((rolePerm) => {
        User.findByPk(req.user?.id, {
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getNestedPath(req, "User.imgPath", "imgpath"),
            "is_active",
            [
              Sequelize.literal(
                `(SELECT (SELECT SUM(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = User.id) / (SELECT count(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = User.id))`
              ),
              "review_avg",
            ],
          ],
          include: [
            {
              model: UserProfile,
              as: "userprofiles",
              attributes: ["about_user", "specialization"],
            },
            {
              model: UserCredentials,
              as: "usercredentials",
              attributes: [getPath(req, "attachments"), "is_authorized"],
            },
            {
              model: UserSkills,
              as: "userskills",
              attributes: ["skill_name"],
            },
            {
              model: Portfolio,
              as: "userportfolio",
              attributes: [
                "title",
                "description",
                getNestedPath(req, "userportfolio.imgPath", "imgpath"),
                "url_link",
                "createdAt",
              ],
            },
            {
              model: UserWallet,
              as: "wallet",
            },
            {
              model: UserReviews,
              attributes: ["comment", "star_rate", "createdAt"],
              as: "talentreview",
              include: [
                {
                  model: User,
                  attributes: [
                    "id",
                    "email",
                    "fullname",
                    "phone",
                    getNestedPath(req, "talentreview.owner.imgPath", "imgpath"),
                  ],
                  as: "owner",
                },
                {
                  model: Project,
                  attributes: ["proj_title", "proj_description", "proj_period"],
                },
              ],
            },
          ],
        })
          .then((user) => res.status(200).send(user)) //
          .catch((error) => {
            console.error(error);
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(403).send({ msg: error });
      });
  }
);

// Update a User
router.put(
  "/:id",
  upload.single("profileImage"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_update")
      .then((rolePerm) => {
        if (
          !req.body.role_id ||
          !req.body.email ||
          !req.body.fullname ||
          !req.body.phone
        ) {
          res.status(400).send({
            msg: "Please pass Role ID, email, password, phone or fullname.",
          });
        } else {
          User.findByPk(req.params.id)
            .then((user) => {
              User.update(
                {
                  email: req.body.email || user.email,
                  fullname: req.body.fullname || user.fullname,
                  password:
                    req.body.password && req.body.password !== ""
                      ? bcrypt.hashSync(
                          req.body.password,
                          bcrypt.genSaltSync(10),
                          null
                        )
                      : user.password,
                  phone: req.body.phone || user.phone,
                  imgPath: req.file?.path || user.file?.path,
                  role_id: req.body.role_id || user.role_id,
                },
                {
                  where: {
                    id: req.params.id,
                  },
                }
              )
                .then((_) => {
                  res.status(200).send({
                    msg: "User updated",
                  });
                })
                .catch((err) => res.status(400).send({ msg: err }));
            })
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Update Admin Profile
router.put(
  "/admin/profile",
  upload.single("profileImage"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_update")
      .then((rolePerm) => {
        if (!req.body.email || !req.body.fullname || !req.body.phone) {
          res.status(400).send({
            msg: "Please pass Role ID, email, password, phone or fullname.",
          });
        } else {
          User.findByPk(req.user.id)
            .then((user) => {
              User.update(
                {
                  email: req.body.email || user.email,
                  fullname: req.body.fullname || user.fullname,
                  password:
                    req.body.password && req.body.password !== ""
                      ? bcrypt.hashSync(
                          req.body.password,
                          bcrypt.genSaltSync(10),
                          null
                        )
                      : user.password,
                  phone: req.body.phone || user.phone,
                  imgPath: req.file?.path || user.file?.path,
                },
                {
                  where: {
                    id: req.user.id,
                  },
                }
              )
                .then((_) => {
                  res.status(200).send({
                    msg: "User updated",
                  });
                })
                .catch((err) => res.status(400).send({ msg: err }));
            })
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Delete a User
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass user ID.",
          });
        } else {
          User.findByPk(req.params.id)
            .then((user) => {
              if (user) {
                User.destroy({
                  where: {
                    id: req.params.id,
                  },
                })
                  .then((_) => {
                    res.status(200).send({
                      msg: "User deleted",
                    });
                  })
                  .catch((err) => res.status(400).send({ msg: err }));
              } else {
                res.status(404).send({
                  msg: "User not found",
                });
              }
            })
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Lock and unlock user
router.put(
  "/lockunlock/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_lock_unlock")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass user ID.",
          });
        } else {
          User.findByPk(req.params.id)
            .then((user) => {
              if (user) {
                User.update(
                  {
                    is_active: !user.is_active,
                  },
                  {
                    where: {
                      id: req.params.id,
                    },
                  }
                )
                  .then((_) => {
                    res.status(200).send({
                      msg: "User status changed",
                    });
                  })
                  .catch((err) => res.status(500).send({ msg: err }));
              } else {
                res.status(404).send({
                  msg: "User not found",
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

// Get Users For chat
router.post(
  "/userschat",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size, query } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "user_get_all")
      .then((rolePerm) => {
        User.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: Role,
              // include: [
              //   {
              //     model: Permission,
              //     as: "permissions",
              //   },
              // ],
            },
          ],
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
            "is_active",
          ],
          //group: ["id"],
          distinct: true,
          order: [["fullname", "ASC"]],
          where: {
            // [Op.not]: [{ id: req.user?.id }],
            fullname: {
              [Op.like]: `%${query}%`,
            },
            id: {
              [Op.not]: req.user?.id,
            },
          },
        })
          .then((users) =>
            res.status(200).send(getPagingData(users, page, limit))
          ) //
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get List of Enginners
router.post(
  "/enginners",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "user_get_enginners")
      .then((rolePerm) => {
        db.sequelize
          .query(
            "select usr.*, (SELECT SUM(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = usr.id) / (SELECT count(star_rate) FROM userreviews AS reviews WHERE reviews.talent_id = usr.id) as review_avg from users as usr where role_id in(select a.id from roles as a " +
              "inner join rolepermissions as ro on a.id = ro.role_id " +
              "inner join permissions as p on ro.perm_id = p.id " +
              "where p.perm_name = 'is_enginner') LIMIT :offset,:limit",
            {
              replacements: { offset, limit },
              type: QueryTypes.SELECT,
              //model: User,
              //mapToModel: true, // pass true here if you have any mapped fields
            }
          )
          .then((users) => {
            const usersCount = { count: users.length, rows: users };
            res.status(200).send(getPagingData(usersCount, page, limit));
          })
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// update or create user Credentails
router.put(
  "/credentials/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_authorize")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass user ID.",
          });
        } else {
          UserCredentials.findOrCreate({
            where: { user_id: req.params?.id },
            defaults: {
              user_id: req.params?.id,
              is_authorized: false,
            },
          })
            .then(([credentials, created]) => {
              if (!credentials) {
                return res.status(404).send({ msg: "User Not Found" });
              } else {
                UserCredentials.update(
                  {
                    is_authorized: !credentials.is_authorized,
                  },
                  {
                    where: {
                      user_id: credentials.user_id,
                    },
                  }
                )
                  .then((_) => {
                    User.findByPk(req.params?.id)
                      .then((user) => {
                        const status =
                          !credentials.is_authorized === true
                            ? "Verified"
                            : "Rejected";
                        sendToUserAuthorize(user, status)
                          .then((_) => {
                            return res
                              .status(200)
                              .send({ msg: "Status has Changed Successfully" });
                          })
                          .catch((err) => {
                            return res.status(500).send({ msg: err });
                          });

                        Notification.create({
                          title: "Credentials Update",
                          description: `hello ${
                            user.fullname
                          }, your identity was ${
                            !credentials.is_authorized === true
                              ? "verified"
                              : "rejected"
                          }`,
                          type: "admin-to-user",
                          sender_id: req.user.id,
                        })
                          .then((notify) => {
                            ReadNotification.create({
                              notification_id: notify.id,
                              receiver_id: user.id,
                            })
                              .then((_) => {
                                sendNotification(
                                  notify.title,
                                  notify.description,
                                  user.id
                                )
                                  .then((_) => console.log("notification sent"))
                                  .catch((err) => console.log(err));
                              })
                              .catch((err) => console.log(err));
                          })
                          .catch((err) => console.error(err));
                      })
                      .catch((err) => console.error(err));
                  })
                  .catch((err) => res.status(500).send({ msg: err }));
              }
            })
            .catch((error) =>
              res.status(500).send({
                msg: error,
              })
            );
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// upload credintials
router.put(
  "/credentials/upload",
  upload.single("usercredintials"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_add_find_credentails")
      .then((rolePerm) => {
        UserCredentials.findOne({
          where: { user_id: req.user.id },
        })
          .then((credentials) => {
            if (!credentials) {
              return res.status(404).send({ msg: "User Not Found" });
            } else {
              UserCredentials.update(
                {
                  attachments: req.file?.path,
                },
                {
                  where: {
                    user_id: credentials.user_id,
                  },
                }
              )
                .then((_) => {
                  return res
                    .status(200)
                    .send({ msg: "File Uploaded Successfully" });
                })
                .catch((err) => res.status(500).send({ msg: err }));
            }
          })
          .catch((error) =>
            res.status(500).send({
              msg: error,
            })
          );
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// find or create Credentails
router.post(
  "/credentials/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_add_find_credentails")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass user ID.",
          });
        } else {
          UserCredentials.findOrCreate({
            where: { user_id: req.user?.id },
            defaults: {
              user_id: req.user?.id,
              is_authorized: false,
            },
          })
            .then(([credentials, created]) => {
              if (!credentials) {
                return res.status(404).send({ msg: "User Not Found" });
              } else {
                return res.status(200).send(credentials);
              }
            })
            .catch((error) =>
              res.status(500).send({
                msg: error,
              })
            );
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

module.exports = router;

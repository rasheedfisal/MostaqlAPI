const express = require("express");
const router = express.Router();
const User = require("../models").User;
const Role = require("../models").Role;
const Project = require("../models").Project;
const Profile = require("../models").Profile;
const PriceRange = require("../models").PriceRange;
const multer = require("multer");
const Permission = require("../models").Permission;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const { Op } = require("sequelize");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");

const mergeUserPermissions = (permissions) => {
  let mergedPermission = [];
  for (let i = 0; i < permissions.length; i++) {
    mergedPermission.push(permissions[i].perm_name);
  }
  return mergedPermission;
};
const convertToUserInfoDto = (user) => {
  const userInfoDto = {
    // id: user.id,
    email: user.email,
    fullname: user.fullname,
    imgPath: user.imgPath, //base64_encode(user.imgPath),
    permissions: mergeUserPermissions(user.Role.permissions),
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
              console.log(error);
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
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
          ],
          //group: ["id"],
          distinct: true,
          order: [["fullname", "ASC"]],
        })
          .then((users) => {
            //res.setHeader("x-total-count", users.count);
            res.status(200).send(getPagingData(users, page, limit));
          })
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
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
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
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
        User.findByPk(req.user?.id, {
          attributes: [
            "id",
            "email",
            "fullname",
            getPath(req, "imgPath"),
            "is_active",
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
          ],
        })
          .then((user) => res.status(200).send(convertToUserInfoDto(user))) //
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
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
                    message: "User updated",
                  });
                })
                .catch((err) => res.status(400).send(err));
            })
            .catch((error) => {
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
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
      .checkPermission(req.user.role_id, "role_delete")
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
                      message: "User deleted",
                    });
                  })
                  .catch((err) => res.status(400).send(err));
              } else {
                res.status(404).send({
                  message: "User not found",
                });
              }
            })
            .catch((error) => {
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
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
            [Op.not]: [{ id: req.user?.id }],
          },
        })
          .then((users) =>
            res.status(200).send(getPagingData(users, page, limit))
          ) //
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

module.exports = router;

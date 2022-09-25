const express = require("express");
const router = express.Router();
const User = require("../models").User;
const UserProfile = require("../models").UserProfile;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

// Create a new UserProfile
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_add")
      .then((rolePerm) => {
        if (
          !req.body.user_id ||
          !req.body.about_user ||
          !req.body.specialization
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          UserProfile.create({
            user_id: req.body.user_id,
            about_user: req.body.about_user,
            specialization: req.body.specialization,
          })
            .then((profile) => res.status(201).send(profile))
            .catch((error) => {
              res.status(400).send({
                success: false,
                msg: error,
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

// Get List of Profiles
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_get_all")
      .then((rolePerm) => {
        console.log(rolePerm);
        UserProfile.findAll({
          attributes: ["about_user", "specialization"],
          include: [
            {
              model: User,
              attributes: ["id", "email", "fullname", "phone", "imgPath"],
            },
          ],
        })
          .then((profile) => res.status(200).send(profile))
          .catch((error) => {
            res.status(400).send({
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

// Get User Profile by ID
router.get(
  "/user/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_get")
      .then((rolePerm) => {})
      .catch((error) => {
        res.status(403).send(error);
      });
    UserProfile.findOne({
      where: {
        user_id: req.params.id,
      },
      attributes: ["about_user", "specialization"],
      include: [
        {
          model: User,
          attributes: ["id", "email", "fullname", "phone", "imgPath"],
        },
      ],
    })
      .then((profile) => res.status(200).send(profile))
      .catch((error) => {
        res.status(400).send({
          success: false,
          msg: error,
        });
      });
  }
);

// Update a UserProfile
router.put(
  "/user/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_update")
      .then((rolePerm) => {
        if (
          !req.params.id ||
          !req.body.about_user ||
          !req.body.specialization
        ) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          UserProfile.findByPk(req.params.id)
            .then((profile) => {
              UserProfile.update(
                {
                  about_user: req.body.about_user || profile.about_user,
                  specialization:
                    req.body.specialization || profile.specialization,
                },
                {
                  where: {
                    user_id: req.params.id,
                  },
                }
              )
                .then((_) => {
                  res.status(200).send({
                    message: "Resourse updated",
                  });
                })
                .catch((err) =>
                  res.status(400).send({
                    success: false,
                    msg: err,
                  })
                );
            })
            .catch((error) => {
              res.status(400).send({
                success: false,
                msg: error,
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

// Delete a UserProfile
router.delete(
  "/user/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          UserProfile.findOne({
            where: {
              user_id: req.params.id,
            },
          })
            .then((profile) => {
              if (profile) {
                UserProfile.destroy({
                  where: {
                    user_id: req.params.id,
                  },
                })
                  .then((_) => {
                    res.status(200).send({
                      message: "Resourse deleted",
                    });
                  })
                  .catch((err) => res.status(400).send(err));
              } else {
                res.status(404).send({
                  message: "Resourse not found",
                });
              }
            })
            .catch((error) => {
              res.status(400).send({
                success: false,
                msg: error,
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

module.exports = router;

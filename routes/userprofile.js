const express = require("express");
const router = express.Router();
const User = require("../models").User;
const UserProfile = require("../models").UserProfile;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPath } = require("../utils/fileUrl");

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
          //!req.body.user_id ||
          !req.body.about_user ||
          !req.body.specialization
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          UserProfile.findOne({
            where: {
              user_id: req.user.id,
            },
          })
            .then((profile) => {
              if (!profile) {
                UserProfile.create({
                  //user_id: req.body.user_id,
                  user_id: req.user.id,
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

              UserProfile.update(
                {
                  about_user: req.body.about_user || profile.about_user,
                  specialization:
                    req.body.specialization || profile.specialization,
                },
                {
                  where: {
                    user_id: profile.id,
                  },
                }
              )
                .then((_) => {
                  res.status(200).send({
                    msg: "Resourse updated",
                  });
                })
                .catch((err) =>
                  res.status(400).send({
                    success: false,
                    msg: err,
                  })
                );
            })
            .catch((error) => res.status(400).send({ msg: error }));
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
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getPath(req, "imgPath"),
              ],
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
        res.status(403).send({ msg: error });
      });
    UserProfile.findOne({
      where: {
        user_id: req.params.id,
      },
      attributes: ["about_user", "specialization"],
      include: [
        {
          model: User,
          attributes: [
            "id",
            "email",
            "fullname",
            "phone",
            getPath(req, "imgPath"),
          ],
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
  "/update",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_update")
      .then((rolePerm) => {
        if (!req.body.about_user || !req.body.specialization) {
          res.status(400).send({
            msg: "Please pass required fields.",
          });
        } else {
          UserProfile.findByPk(req.user.id)
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
                    msg: "Resourse updated",
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
// router.delete(
//   "/user/:id",
//   passport.authenticate("jwt", {
//     session: false,
//   }),
//   function (req, res) {
//     helper
//       .checkPermission(req.user.role_id, "profile_delete")
//       .then((rolePerm) => {
//         if (!req.params.id) {
//           res.status(400).send({
//             msg: "Please pass resourse ID.",
//           });
//         } else {
//           UserProfile.findOne({
//             where: {
//               user_id: req.params.id,
//             },
//           })
//             .then((profile) => {
//               if (profile) {
//                 UserProfile.destroy({
//                   where: {
//                     user_id: req.params.id,
//                   },
//                 })
//                   .then((_) => {
//                     res.status(200).send({
//                       msg: "Resourse deleted",
//                     });
//                   })
//                   .catch((err) => res.status(400).send({msg: err}));
//               } else {
//                 res.status(404).send({
//                   msg: "Resourse not found",
//                 });
//               }
//             })
//             .catch((error) => {
//               res.status(400).send({
//                 success: false,
//                 msg: error,
//               });
//             });
//         }
//       })
//       .catch((error) => {
//         res.status(403).send({
//           success: false,
//           msg: error,
//         });
//       });
//   }
// );

module.exports = router;

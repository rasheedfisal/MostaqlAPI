const express = require("express");
const router = express.Router();
const {
  User,
  UserProfile,
  UserSkills,
  Portfolio,
  UserCredentials,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPath, getNestedPath } = require("../utils/fileUrl");
const { getPagination, getPagingData } = require("../utils/pagination");
const multer = require("multer");

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
    req.fileValidationError = "Forbidden extension";
    cb(null, false, req.fileValidationError);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

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
        if (!req.body.about_user || !req.body.specialization) {
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
              } else {
                UserProfile.update(
                  {
                    about_user: req.body.about_user || profile.about_user,
                    specialization:
                      req.body.specialization || profile.specialization,
                  },
                  {
                    where: {
                      id: profile.id,
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
              }
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
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "profile_get_all")
      .then((rolePerm) => {
        UserProfile.findAndCountAll({
          limit,
          offset,
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
          .then((profile) =>
            res.status(200).send(getPagingData(profile, page, limit))
          )
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
      .then((rolePerm) => {
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
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get User Profile
router.get(
  "/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_get")
      .then((rolePerm) => {
        UserProfile.findOne({
          where: {
            user_id: req.user?.id,
          },
          attributes: ["about_user", "specialization"],
          include: [
            {
              model: User,
              as: "profileOwner",
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getNestedPath(req, "profileOwner.imgPath", "imgpath"),
              ],
              include: [
                {
                  model: UserCredentials,
                  as: "usercredentials",
                  attributes: ["attachments", "is_authorized"],
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
                    getNestedPath(
                      req,
                      "profileOwner.userportfolio.imgPath",
                      "imgpath"
                    ),
                    "url_link",
                    "createdAt",
                  ],
                },
              ],
            },
          ],
        })
          .then((profile) => {
            res.status(200).send(profile);
          })
          .catch((error) => {
            console.log(error);
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
                    user_id: req.user?.id,
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

//////////////////////////// skills /////////////////////////////////
// add skill
router.post(
  "/skill",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_add")
      .then((rolePerm) => {
        if (!req.body.skillname) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          UserSkills.create({
            user_id: req.user?.id,
            skill_name: req.body.skillname,
          })
            .then((skill) => res.status(201).send(skill))
            .catch((err) => res.status(500).send({ msg: err }));
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

// Get List of Profile Skills
router.get(
  "/skill",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_get_all")
      .then((rolePerm) => {
        UserSkills.findAll(
          {
            attributes: ["id", "skill_name"],
          },
          { where: { user_id: req.user?.id } }
        )
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

// Get User Profile skill by ID
router.get(
  "/skill/get/:id",
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
    UserSkills.findOne({
      where: {
        id: req.params.id,
      },
      attributes: ["id", "skill_name"],
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

// Update a UserSkill
router.put(
  "/skill/update/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_update")
      .then((rolePerm) => {
        if (!req.body.skillname || !req.params?.id) {
          res.status(400).send({
            msg: "Please pass required fields.",
          });
        } else {
          UserSkills.findByPk(req.params.id)
            .then((skills) => {
              if (!skills)
                return res.status(404).send({ msg: "Skill Not Found" });

              UserSkills.update(
                {
                  skill_name: req.body.skillname || skills.skill_name,
                },
                {
                  where: {
                    id: req.params.id,
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

// Delete a UserSkill
router.delete(
  "/skill/delete/:id",
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
          UserSkills.findOne({
            where: {
              id: req.params.id,
            },
          })
            .then((skill) => {
              if (skill) {
                UserSkills.destroy({
                  where: {
                    id: req.params.id,
                  },
                })
                  .then((_) => {
                    res.status(200).send({
                      msg: "Resourse deleted",
                    });
                  })
                  .catch((err) => res.status(400).send({ msg: err }));
              } else {
                res.status(404).send({
                  msg: "Resourse not found",
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

/////////////////// Portfolio ////////////////////////////

// add Portfolio
router.post(
  "/portfolio",
  upload.single("PortfolioImg"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_add")
      .then((rolePerm) => {
        if (!req.body.title || !req.body.description) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else if (req.fileValidationError) {
          res.status(400).send({
            msg: "Wrong file Extension.",
          });
        } else {
          Portfolio.create({
            user_id: req.user?.id,
            title: req.body.title,
            description: req.body.description,
            imgpath: req.file?.path,
            url_link: req.body?.urllink,
          })
            .then((portfolio) => res.status(201).send(portfolio))
            .catch((err) => res.status(500).send({ msg: err }));
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

// Get List of User Portfolio
router.get(
  "/portfolio",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_get_all")
      .then((rolePerm) => {
        Portfolio.findAll(
          {
            attributes: [
              "id",
              "title",
              "description",
              getPath(req, "imgpath"),
              getPath(req, "url_link"),
              "createdAt",
            ],
          },
          {
            where: {
              user_id: req.user?.id,
            },
          }
        )
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

// Get Portfolio by ID
router.get(
  "/portfolio/get/:id",
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
    Portfolio.findOne({
      where: {
        id: req.params.id,
      },
      attributes: [
        "id",
        "title",
        "description",
        getPath(req, "imgpath"),
        getPath(req, "url_link"),
        "createdAt",
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

// Update a Portfolio
router.put(
  "/portfolio/update/:id",
  upload.single("PortfolioImg"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "profile_update")
      .then((rolePerm) => {
        if (!req.params?.id) {
          res.status(400).send({
            msg: "Please pass Id field.",
          });
        } else if (req.fileValidationError) {
          res.status(400).send({
            msg: "Wrong file Extension.",
          });
        } else {
          Portfolio.findByPk(req.params.id)
            .then((portfolio) => {
              if (!portfolio)
                return res.status(404).send({ msg: "Portfolio Not Found" });

              Portfolio.update(
                {
                  title: req.body.title || portfolio.title,
                  description: req.body.description || portfolio.description,
                  imgpath: req.file?.path || portfolio.imgpath,
                  url_link: req.body.urllink || portfolio.url_link,
                },
                {
                  where: {
                    id: req.params.id,
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

// Delete a Portfolio
router.delete(
  "/portfolio/delete/:id",
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
          Portfolio.findOne({
            where: {
              id: req.params.id,
            },
          })
            .then((portfolio) => {
              if (portfolio) {
                Portfolio.destroy({
                  where: {
                    id: req.params.id,
                  },
                })
                  .then((_) => {
                    res.status(200).send({
                      msg: "Resourse deleted",
                    });
                  })
                  .catch((err) => res.status(400).send({ msg: err }));
              } else {
                res.status(404).send({
                  msg: "Resourse not found",
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

const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  User,
  Project,
  ProjStatus,
  Category,
  PriceRange,
  ProjectOffer,
  UserProfile,
  SubCategories,
  UserCredentials,
  sequelize,
  ProjectCloseRequest,
  ProjectCompletedRequest,
  Notification,
  ReadNotification,
  UserWallet,
  CommissionRate,
  Transactions,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const Sequelize = require("sequelize");
const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath, getNestedPath } = require("../utils/fileUrl");
// const { getAllEnginnerEmailList } = require("../utils/findUsers");
// const { sendToAllEnginners } = require("../utils/advanceMailer");
const { sendNotification } = require("../utils/advanceNotifier");
const { handleForbidden, handleResponse } = require("../utils/handleError");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") + "proj_" + file.originalname
    );
  },
});

const imageFilter = (req, file, cb) => {
  if (
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

// Create a new Project
router.post(
  "/",
  upload.single("ProjectAttach"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "project_add")
      .then((rolePerm) => {
        if (
          !req.body.proj_title ||
          !req.body.proj_description ||
          !req.body.category_id ||
          !req.body.price_range_id ||
          !req.body.proj_period
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else if (req.fileValidationError) {
          res.status(400).send({
            msg: "Wrong file Extension.",
          });
        } else {
          UserCredentials.findOne({ where: { user_id: req.user?.id } })
            .then((credential) => {
              if (credential?.is_authorized) {
                ProjStatus.findOne({
                  where: {
                    stat_name: "Open",
                  },
                })
                  .then((status) => {
                    sequelize
                      .query(
                        "select count(*) as isOwner from users where role_id in(select a.id from roles as a " +
                          "inner join rolepermissions as ro on a.id = ro.role_id " +
                          "inner join permissions as p on ro.perm_id = p.id " +
                          "where p.perm_name = 'is_project_owner') and id=:uId",
                        {
                          replacements: { uId: req.user.id },
                          type: QueryTypes.SELECT,
                        }
                      )
                      .then((count) => {
                        if (count[0].isOwner > 0) {
                          Project.create({
                            user_added_id: req.user?.id,
                            proj_title: req.body.proj_title,
                            proj_description: req.body.proj_description,
                            category_id: req.body.category_id,
                            price_range_id: req.body.price_range_id,
                            proj_period: req.body.proj_period,
                            attatchment_file: req.file?.path,
                            proj_status_id: status.id,
                            skills: req.body?.skills,
                          })
                            .then((project) => {
                              // const allEnginner = getAllEnginnerEmailList();
                              // allEnginner
                              //   .then((eng) => {
                              //     sendToAllEnginners(
                              //       eng.map((a) => a.email),
                              //       project
                              //     );
                              //   })
                              //   .catch((err) => {
                              //     console.error(err);
                              //   });
                              res.status(201).send(project);
                            })
                            .catch((error) => {
                              res.status(500).send({
                                success: false,
                                msg: error,
                              });
                            });
                        } else {
                          res.status(400).send({
                            success: false,
                            msg: "User is not a project owner",
                          });
                        }
                      })
                      .catch((err) => {
                        res.status(500).send({
                          success: false,
                          msg: error,
                        });
                      });
                  })
                  .catch((error) => {
                    res.status(400).send({ msg: error });
                  });
              } else {
                res.status(401).send({
                  msg: "user credentials are not verified",
                });
              }
            })
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

// Get List of Projects
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size, search } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_get_all")
      .then((rolePerm) => {
        ProjStatus.findOne({
          where: {
            stat_name: "Open",
          },
        })
          .then((stat) => {
            Project.findAndCountAll({
              limit,
              offset,
              attributes: [
                "id",
                "proj_title",
                "proj_description",
                "skills",
                "proj_period",
                "CreatedAt",
                getPath(req, "attatchment_file"),
                [
                  Sequelize.literal(
                    `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = Project.id)`
                  ),
                  "OffersCount",
                ],
              ],
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: [
                    "fullname",
                    getNestedPath(req, "owner.imgPath", "avatar"),
                    // [
                    //   Sequelize.fn(
                    //     "concat",
                    //     req.headers.host,
                    //     "/",
                    //     Sequelize.col("owner.imgPath")
                    //   ),
                    //   "avatar",
                    // ],
                  ],
                },
                {
                  model: SubCategories,
                  attributes: ["name"],
                  include: {
                    model: Category,
                    attributes: ["cat_name", getPath(req, "cat_img")],
                  },
                },
                {
                  model: PriceRange,
                  attributes: ["range_name"],
                },
                {
                  model: ProjStatus,
                  attributes: ["stat_name"],
                },
              ],
              distinct: true,
              order: [["createdAt", "desc"]],
              where: {
                proj_title: {
                  [Op.like]: `%${search}%`,
                },
                proj_status_id: {
                  [Op.eq]: stat.id,
                },
                user_added_id: {
                  [Op.ne]: req.user?.id,
                },
                id: {
                  [Op.notIn]: Sequelize.literal(
                    `(SELECT offer.proj_id FROM projectoffers AS offer WHERE offer.user_offered_id= '${req.user.id}')`
                  ),
                },
              },
            })
              .then((projects) =>
                res.status(200).send(getPagingData(projects, page, limit))
              )
              .catch((error) => {
                console.log(error);
                res.status(500).send({
                  success: false,
                  msg: error,
                });
              });
          })
          .catch((err) => {
            res.status(400).send({
              success: false,
              msg: error,
            });
          });
        //console.log(rolePerm);
      })
      .catch((error) => {
        res.status(403).send({
          success: false,
          msg: error,
        });
      });
  }
);
// Get Admin List of Projects
router.get(
  "/admin",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size, search } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_get_all")
      .then((rolePerm) => {
        //console.log(rolePerm);
        Project.findAndCountAll({
          limit,
          offset,
          attributes: [
            "id",
            "proj_title",
            "proj_description",
            "skills",
            "proj_period",
            "CreatedAt",
            getPath(req, "attatchment_file"),
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = Project.id)`
              ),
              "OffersCount",
            ],
          ],
          include: [
            {
              model: User,
              as: "owner",
              attributes: [
                "fullname",
                getNestedPath(req, "owner.imgPath", "avatar"),
                // [
                //   Sequelize.fn(
                //     "concat",
                //     req.headers.host,
                //     "/",
                //     Sequelize.col("owner.imgPath")
                //   ),
                //   "avatar",
                // ],
              ],
            },
            {
              model: SubCategories,
              attributes: ["name"],
              include: {
                model: Category,
                attributes: ["cat_name", getPath(req, "cat_img")],
              },
            },
            {
              model: PriceRange,
              attributes: ["range_name"],
            },
            {
              model: ProjStatus,
              attributes: ["stat_name"],
            },
          ],
          distinct: true,
          where: {
            proj_title: {
              [Op.like]: `%${search}%`,
            },
          },
          order: [["createdAt", "desc"]],
        })
          .then((projects) =>
            res.status(200).send(getPagingData(projects, page, limit))
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

// Get List of Projects by Sub Category
router.get(
  "/subcat",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size, scatid } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_get_all")
      .then((rolePerm) => {
        //console.log(rolePerm);
        Project.findAndCountAll({
          limit,
          offset,
          attributes: [
            "id",
            "proj_title",
            "proj_description",
            "skills",
            "proj_period",
            "CreatedAt",
            getPath(req, "attatchment_file"),
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = Project.id)`
              ),
              "OffersCount",
            ],
          ],
          include: [
            {
              model: User,
              as: "owner",
              attributes: [
                "fullname",
                getNestedPath(req, "owner.imgPath", "avatar"),
                // [
                //   Sequelize.fn(
                //     "concat",
                //     req.headers.host,
                //     "/",
                //     Sequelize.col("owner.imgPath")
                //   ),
                //   "avatar",
                // ],
              ],
            },
            {
              model: SubCategories,
              attributes: ["name"],
              include: {
                model: Category,
                attributes: ["cat_name", getPath(req, "cat_img")],
              },
            },
            {
              model: PriceRange,
              attributes: ["range_name"],
            },
            {
              model: ProjStatus,
              attributes: ["stat_name"],
            },
          ],
          distinct: true,
          where: {
            category_id: scatid,
          },
          order: [["createdAt", "desc"]],
        })
          .then((projects) =>
            res.status(200).send(getPagingData(projects, page, limit))
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

// Get Project by ID
// router.get(
//   "/:id",
//   passport.authenticate("jwt", {
//     session: false,
//   }),
//   function (req, res) {
//     helper
//       .checkPermission(req.user.role_id, "project_get")
//       .then((rolePerm) => {})
//       .catch((error) => {
//         res.status(403).send({msg: error});
//       });
//     Project.findByPk(req.params.id, {
//       attributes: [
//         "id",
//         "proj_title",
//         "proj_description",
//         "proj_period",
//         "CreatedAt",
//         getPath(req, "attatchment_file"),
//         ,
//         [
//           Sequelize.literal(
//             `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = id AND offer.user_offered_id = "${req.user?.id}")`
//           ),
//           "UserOfferCount",
//         ],
//         [
//           Sequelize.literal(
//             `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = id)`
//           ),
//           "OffersCount",
//         ],
//       ],
//       include: [
//         {
//           model: User,
//           attributes: ["fullname", getPath(req, "imgPath")],
//         },
//         {
//           model: Category,
//           attributes: ["cat_name", getPath(req, "cat_img")],
//         },
//         {
//           model: PriceRange,
//           attributes: ["range_name"],
//         },
//         {
//           model: ProjStatus,
//           attributes: ["stat_name"],
//         },
//       ],
//     })
//       .then((project) => res.status(200).send(project))
//       .catch((error) => {
//         res.status(400).send({
//           success: false,
//           msg: error,
//         });
//       });
//   }
// );

// Update a Project

router.put(
  "/:id",
  upload.single("ProjectAttach"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "project_update")
      .then((rolePerm) => {
        if (
          !req.params.id
          // !req.params.id ||
          // !req.body.user_added_id ||
          // !req.body.proj_title ||
          // !req.body.proj_description ||
          // !req.body.category_id ||
          // !req.body.price_range_id ||
          // !req.body.proj_period
        ) {
          res.status(400).send({
            //msg: "Please pass ID and required fields.",
            msg: "Please pass ID and fields you want to update.",
          });
        } else {
          Project.findByPk(req.params.id)
            .then((project) => {
              Project.update(
                {
                  user_added_id:
                    req.body.user_added_id || project.user_added_id,
                  proj_title: req.body.proj_title || project.proj_title,
                  proj_description:
                    req.body.proj_description || project.proj_description,
                  category_id: req.body.category_id || project.category_id,
                  price_range_id:
                    req.body.price_range_id || project.price_range_id,
                  proj_period: req.body.proj_period || project.proj_period,
                  attatchment_file: req.file?.path || project.attatchment_file,
                  proj_status_id:
                    req.body.proj_status_id || project.proj_status_id,
                  skills: req.body?.skills || project.skills,
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

// Delete a Project
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "project_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          Project.findByPk(req.params.id)
            .then((role) => {
              if (role) {
                Project.destroy({
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

// Get owner Projects by ID
router.get(
  "/owner",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_get_project")
      .then((rolePerm) => {
        Project.findAll({
          attributes: [
            "id",
            "proj_title",
            "proj_description",
            "skills",
            "proj_period",
            "CreatedAt",
            //getPath(req, "attatchment_file"),
            // [
            //   Sequelize.literal(
            //     `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = id AND offer.user_offered_id = "${req.user?.id}")`
            //   ),
            //   "UserOfferCount",
            // ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = Project.id)`
              ),
              "OffersCount",
            ],
          ],
          include: [
            {
              model: SubCategories,
              attributes: ["name"],
              include: {
                model: Category,
                attributes: ["cat_name", getPath(req, "cat_img")],
              },
            },
            {
              model: PriceRange,
              attributes: ["range_name"],
            },
            {
              model: ProjStatus,
              attributes: ["stat_name"],
            },
          ],
          where: {
            user_added_id: req.user?.id,
          },
        })
          .then((projects) => res.status(200).send(projects))
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get Project by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    // const { page, size } = req.query;
    // const { limit, offset } = getPagination(page, size);

    console.log(req.user.role_id);
    //res.status(200).send(req.user.role_id);
    helper
      .checkPermission(req.user.role_id, "project_get")
      .then((rolePerm) => {
        //console.log(rolePerm);
        Project.findByPk(req.params.id, {
          // limit,
          // offset,
          attributes: [
            "id",
            "proj_title",
            "proj_description",
            "skills",
            "proj_period",
            "CreatedAt",
            getPath(req, "attatchment_file"),
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = "${req.params.id}" AND offer.user_offered_id = "${req.user?.id}")`
              ),
              "UserOfferCount", // if UserOfferCount > 0 then he should not make another offer
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projects AS project WHERE project.id = "${req.params.id}" AND project.user_added_id = "${req.user?.id}")`
              ),
              "IsProjectOwner", // if IsProjectOwner > 0 then the current user is the owner of this project
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = "${req.params.id}")`
              ),
              "OffersCount",
            ],
            [
              Sequelize.literal(
                `(select ratepercent from commissionrates where iscurrent=1 limit 1)`
              ),
              "rate_percent",
            ],
          ],
          include: [
            {
              model: User,
              as: "owner",
              attributes: [
                "fullname",
                getNestedPath(req, "owner.imgPath", "avatar"),
                // [
                //   Sequelize.fn(
                //     "concat",
                //     req.headers.host,
                //     "/",
                //     Sequelize.col("owner.imgPath")
                //   ),
                //   "avatar",
                // ],
              ],
              //attributes: ["fullname"],
            },
            {
              model: SubCategories,
              attributes: ["name"],
              include: {
                model: Category,
                attributes: ["cat_name", getPath(req, "cat_img")],
              },
            },
            {
              model: PriceRange,
              attributes: ["range_name"],
            },
            {
              model: ProjStatus,
              attributes: ["stat_name"],
            },
            {
              model: ProjectOffer,
              as: "projectoffers",
              attributes: [
                "id",
                "proj_id",
                "user_offered_id",
                "price",
                "days_to_deliver",
                "message_desc",
                getPath(req, "pdf_url"),
                "createdAt",
              ],
              include: [
                {
                  model: User,
                  as: "client",
                  attributes: [
                    "fullname",
                    getNestedPath(
                      req,
                      "projectoffers.client.imgPath",
                      "avatar"
                    ),
                    // [
                    //   Sequelize.fn(
                    //     "concat",
                    //     req.headers.host,
                    //     "/",
                    //     Sequelize.col("projectoffers.client.imgPath")
                    //   ),
                    //   "avatar",
                    // ],
                  ],
                  include: {
                    model: UserProfile,
                    as: "userprofiles",
                    attributes: ["about_user", "specialization"],
                  },
                },
              ],
            },
          ],
          // where: {
          //   id: req.params.id,
          // },
          //distinct: true,
        })
          .then((projectDetails) => res.status(200).send(projectDetails))
          .catch((error) => {
            console.log(error);
            res.status(400).send({
              success: false,
              msg: error,
            });
          });
      })
      .catch((error) => {
        console.log(error);
        res.status(403).send({
          success: false,
          msg: error,
        });
      });
  }
);

// send close request
router.post(
  "/request/close/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "update_offer_status")
      .then((rolePerm) => {
        if (!req.params.id || !req.body.reason) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          let notify = {};
          let reqUsers = [];
          sequelize
            .transaction((t) => {
              // chain all your queries here. make sure you return them.
              return ProjectCloseRequest.create(
                {
                  reason: req.body.reason,
                  proj_id: req.params.id,
                },
                { transaction: t }
              )
                .then((request) => {
                  return Project.findOne(
                    {
                      where: {
                        id: req.params.id,
                      },
                    },
                    { transaction: t }
                  );
                })
                .then((proj) => {
                  return Notification.create(
                    {
                      title: "Project Cancellation Request",
                      description: `user ${req.user.fullname} is requesting to cancel his project ${proj.proj_title}`,
                      type: "user-to-admin",
                      sender_id: req.user.id,
                    },
                    { transaction: t }
                  );
                })
                .then((notification) => {
                  notify = notification;
                  return sequelize.query(
                    "select id,email from users where role_id in(select a.id from roles as a " +
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
                  reqUsers = users;
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
              var notifyPromises = [];
              reqUsers.map((a) => {
                const notifyPromise = sendNotification(
                  notify.title,
                  notify.description,
                  a.id
                );
                notifyPromises.push(notifyPromise);
              });
              Promise.all(notifyPromises).then((_) => {
                console.log("success");
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
              res.status(201).send({
                msg: "Resourse Created",
              });
            })
            .catch((err) => {
              console.log(err);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
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

// Approve or Reject Close Request
router.put(
  "/close/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "project_cancel_update_status")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          let proj_details = {};
          let notifiyUser = {};
          sequelize
            .transaction((t) => {
              // chain all your queries here. make sure you return them.
              return ProjectCloseRequest.update(
                {
                  accepted: true,
                },
                {
                  where: {
                    proj_id: req.params.id,
                  },
                },
                { transaction: t }
              )
                .then((request) => {
                  return ProjStatus.findOne(
                    {
                      where: {
                        stat_name: "Closed",
                      },
                    },
                    { transaction: t }
                  );
                })
                .then((stat) => {
                  return Project.update(
                    {
                      proj_status_id: stat.id,
                    },
                    {
                      where: {
                        id: req.params.id,
                      },
                    },
                    { transaction: t }
                  );
                })
                .then((_) => {
                  return Project.findOne(
                    {
                      include: [
                        {
                          model: ProjectOffer,
                          as: "projectoffers",
                          include: {
                            model: User,
                            as: "client",
                          },
                        },
                        {
                          model: User,
                          as: "owner",
                        },
                      ],
                      where: {
                        id: req.params.id,
                      },
                    },
                    { transaction: t }
                  );
                })
                .then((proj) => {
                  proj_details = proj;
                  return Notification.create(
                    {
                      title: "Project Cancelled",
                      description: `project ${proj.proj_title} was cancelled`,
                      type: "admin-to-user",
                      sender_id: req.user.id,
                    },
                    { transaction: t }
                  );
                })
                .then((notify) => {
                  notifiyUser = notify;

                  var promises = [];
                  proj_details.projectoffers.map((a) => {
                    var newPromise = ReadNotification.create(
                      {
                        notification_id: notify.id,
                        receiver_id: a.user_offered_id,
                      },
                      { transaction: t }
                    );
                    promises.push(newPromise);
                  });

                  const ownerPromise = ReadNotification.create(
                    {
                      notification_id: notify.id,
                      receiver_id: proj_details.user_added_id,
                    },
                    { transaction: t }
                  );
                  promises.push(ownerPromise);

                  return Promise.all(promises);
                });
            })
            .then((_) => {
              proj_details.projectoffers.map((a) => {
                sendNotification(
                  notifiyUser.title,
                  notifiyUser.description,
                  a.client.id
                ).then((_) => {
                  console.log(`message sent ${a.user_offered_id}`);
                });
              });
              sendNotification(
                notifiyUser.title,
                notifiyUser.description,
                proj_details.owner.id
              ).then((_) => {
                console.log(`message sent ${proj_details.user_added_id}`);
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
              res.status(200).send({
                msg: "Resourse updated",
              });
            })
            .catch((err) => {
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
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

// Get List of close Project requests
router.get(
  "/request/close",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_get_all")
      .then((rolePerm) => {
        //console.log(rolePerm);
        ProjectCloseRequest.findAndCountAll({
          limit,
          offset,
          include: {
            model: Project,
            as: "ownerProject",
            attributes: [
              "id",
              "proj_title",
              "proj_description",
              "skills",
              "proj_period",
              "CreatedAt",
            ],
            include: [
              {
                model: User,
                as: "owner",
                attributes: [
                  "id",
                  "email",
                  "fullname",
                  "phone",
                  getNestedPath(req, "ownerProject.owner.imgPath", "avatar"),
                  // [
                  //   Sequelize.fn(
                  //     "concat",
                  //     req.headers.host,
                  //     "/",
                  //     Sequelize.col("ownerProject.owner.imgPath")
                  //   ),
                  //   "avatar",
                  // ],
                  "is_active",
                ],
              },
              {
                model: PriceRange,
                attributes: ["range_name"],
              },
              {
                model: ProjStatus,
                attributes: ["stat_name"],
              },
            ],
          },
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((projects) =>
            res.status(200).send(getPagingData(projects, page, limit))
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

// Get List of Completed Project requests
router.get(
  "/request/completed",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_get_all")
      .then((rolePerm) => {
        //console.log(rolePerm);
        ProjectCompletedRequest.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: Project,
              as: "ownerProject",
              attributes: [
                "id",
                "proj_title",
                "proj_description",
                "skills",
                "proj_period",
                "CreatedAt",
              ],
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: [
                    "id",
                    "email",
                    "fullname",
                    "phone",
                    getNestedPath(req, "ownerProject.owner.imgPath", "avatar"),
                    // [
                    //   Sequelize.fn(
                    //     "concat",
                    //     req.headers.host,
                    //     "/",
                    //     Sequelize.col("ownerProject.owner.imgPath")
                    //   ),
                    //   "avatar",
                    // ],
                    "is_active",
                  ],
                  include: {
                    model: UserWallet,
                    as: "wallet",
                  },
                },
                {
                  model: PriceRange,
                  attributes: ["range_name"],
                },
                {
                  model: ProjStatus,
                  attributes: ["stat_name"],
                },
              ],
            },
            {
              model: ProjectOffer,
              as: "winning_offer",
              include: [
                {
                  model: User,
                  as: "client",
                  attributes: [
                    "id",
                    "email",
                    "fullname",
                    "phone",
                    getNestedPath(
                      req,
                      "winning_offer.client.imgPath",
                      "avatar"
                    ),
                    // [
                    //   Sequelize.fn(
                    //     "concat",
                    //     req.headers.host,
                    //     "/",
                    //     Sequelize.col("winning_offer.client.imgPath")
                    //   ),
                    //   "avatar",
                    // ],
                    "is_active",
                  ],
                  include: {
                    model: UserWallet,
                    as: "wallet",
                  },
                },
                {
                  model: CommissionRate,
                  as: "commissionRate",
                },
              ],
            },
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((projects) =>
            res.status(200).send(getPagingData(projects, page, limit))
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

// Approve or Reject Completed Request
router.put(
  "/completed/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "project_cancel_update_status"
      );

      if (!req.params.id || !req.body.offer_id)
        return handleResponse(res, "Please Pass Required Fields.", 400);

      const request = await ProjectCompletedRequest.findOne({
        where: {
          proj_id: req.params.id,
          offer_id: req.body.offer_id,
        },
      });

      if (!request) return handleResponse(res, "Request Not Found.", 404);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        await ProjectCompletedRequest.update(
          {
            approved: true,
          },
          {
            where: {
              id: request.id,
            },
          },
          { transaction: t }
        );
        const completeStatus = await ProjStatus.findOne(
          {
            where: {
              stat_name: "Completed",
            },
          },
          { transaction: t }
        );
        await Project.update(
          {
            proj_status_id: completeStatus.id,
          },
          {
            where: {
              id: req.params.id,
            },
          },
          { transaction: t }
        );
        const projectDetails = await Project.findOne(
          {
            include: [
              {
                model: ProjectOffer,
                as: "projectoffers",
                where: { id: req.body.offer_id },
                include: {
                  model: User,
                  as: "client",
                },
              },
              {
                model: User,
                as: "owner",
              },
            ],
            where: {
              id: req.params.id,
            },
          },
          { transaction: t }
        );
        const notify = await Notification.create(
          {
            title: "Project Completed",
            description: `project ${projectDetails.proj_title} was completed please check your wallets`,
            type: "admin-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );

        var promises = [];
        projectDetails.projectoffers.map((a) => {
          var newPromise = ReadNotification.create(
            {
              notification_id: notify.id,
              receiver_id: a.user_offered_id,
            },
            { transaction: t }
          );
          promises.push(newPromise);
        });

        const ownerPromise = ReadNotification.create(
          {
            notification_id: notify.id,
            receiver_id: projectDetails.user_added_id,
          },
          { transaction: t }
        );
        promises.push(ownerPromise);

        await Promise.all(promises);

        projectDetails.projectoffers.map(async (a) => {
          await sendNotification(notify.title, notify.description, a.client.id);
        });
        await sendNotification(
          notify.title,
          notify.description,
          projectDetails.owner.id
        );

        return handleResponse(res, "Resources Updated Successfully.", 200);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

// money transfer for completed projects
router.put(
  "/completed/transfer/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "project_cancel_update_status"
      );

      if (!req.params.id || !req.body.offer_id)
        return handleResponse(res, "Please Pass Required Fields.", 400);

      const request = await ProjectCompletedRequest.findOne({
        where: {
          proj_id: req.params.id,
          offer_id: req.body.offer_id,
        },
      });
      if (!request) return handleResponse(res, "Request Not Found.", 404);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const projectDetails = await Project.findOne(
          {
            include: [
              {
                model: ProjectOffer,
                as: "projectoffers",
                where: { id: req.body.offer_id },
                include: [
                  {
                    model: User,
                    as: "client",
                  },
                  {
                    model: CommissionRate,
                    as: "commissionRate",
                  },
                ],
              },
              {
                model: User,
                as: "owner",
              },
            ],
            where: {
              id: req.params.id,
            },
          },
          { transaction: t }
        );
        const talentPromise = Transactions.create(
          {
            beneficiary_id: projectDetails.projectoffers[0].client.id,
            type: "dr",
            amount: projectDetails.projectoffers[0].price,
            message: `${projectDetails.projectoffers[0].price} have been added to your account for completing ${projectDetails.proj_title} check your wallet`,
            user_id: req.user.id,
          },
          { transaction: t }
        );
        const ownerPromise = Transactions.create(
          {
            beneficiary_id: projectDetails.owner.id,
            type: "cr",
            amount: projectDetails.projectoffers[0].price,
            message: `${projectDetails.projectoffers[0].price} have been withdrawn from your account for completing ${projectDetails.proj_title} as project expense check your wallet`,
            user_id: req.user.id,
          },
          { transaction: t }
        );
        await Promise.all([talentPromise, ownerPromise]);
        await ProjectCompletedRequest.update(
          {
            is_transfered: true,
          },
          {
            where: {
              id: request.id,
            },
          },
          { transaction: t }
        );
        const wallet = UserWallet.findOne(
          {
            where: {
              user_id: projectDetails.projectoffers[0].client.id,
            },
          },
          { transaction: t }
        );
        const ratePercent =
          projectDetails.projectoffers[0].commissionRate.ratepercent;
        const discountAmount =
          (projectDetails.projectoffers[0].price * ratePercent) / 100;
        const amount = projectDetails.projectoffers[0].price - discountAmount;
        if (wallet) {
          await UserWallet.update(
            {
              credit: +wallet.credit + +amount,
            },
            {
              where: {
                id: wallet.id,
              },
            },
            { transaction: t }
          );
        } else {
          await UserWallet.create(
            {
              user_id: projectDetails.projectoffers[0].client.id,
              credit: amount,
            },
            { transaction: t }
          );
        }
        const ownerWallet = await UserWallet.findOne({
          where: {
            user_id: projectDetails.owner.id,
          },
        });
        if (ownerWallet) {
          await UserWallet.update(
            {
              credit:
                ownerWallet.credit -
                (+projectDetails.projectoffers[0].price + +discountAmount),
            },
            {
              where: {
                id: ownerWallet.id,
              },
            },
            { transaction: t }
          );
        } else {
          await UserWallet.create(
            {
              user_id: projectDetails.owner.id,
              credit: -projectDetails.projectoffers[0].price,
            },
            { transaction: t }
          );
        }
        const notify = await Notification.create(
          {
            title: "Money Transfer",
            description: `project ${projectDetails.proj_title} was completed please check your wallets`,
            type: "admin-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );

        var promises = [];
        projectDetails.projectoffers.map((a) => {
          var newPromise = ReadNotification.create(
            {
              notification_id: notify.id,
              receiver_id: a.user_offered_id,
            },
            { transaction: t }
          );
          promises.push(newPromise);
        });

        const ownerReadPromise = ReadNotification.create(
          {
            notification_id: notify.id,
            receiver_id: projectDetails.user_added_id,
          },
          { transaction: t }
        );
        promises.push(ownerReadPromise);

        await Promise.all(promises);

        projectDetails.projectoffers.map(async (a) => {
          await sendNotification(notify.title, notify.description, a.client.id);
        });
        await sendNotification(
          notify.title,
          notify.description,
          projectDetails.owner.id
        );

        return handleResponse(res, "Resources Updated Successfully.");
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);
module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../models").User;
const Project = require("../models").Project;
const ProjStatus = require("../models").ProjStatus;
const Category = require("../models").Category;
const PriceRange = require("../models").PriceRange;
const ProjectOffer = require("../models").ProjectOffer;
const UserProfile = require("../models").UserProfile;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const Sequelize = require("sequelize");
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");

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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
        } else {
          ProjStatus.findOne({
            where: {
              stat_name: "Open",
            },
          })
            .then((status) => {
              Project.create({
                user_added_id: req.user?.id,
                proj_title: req.body.proj_title,
                proj_description: req.body.proj_description,
                category_id: req.body.category_id,
                price_range_id: req.body.price_range_id,
                proj_period: req.body.proj_period,
                attatchment_file: req.file?.path,
                proj_status_id: status.id,
              })
                .then((profile) => res.status(201).send(profile))
                .catch((error) => {
                  res.status(400).send({
                    success: false,
                    msg: error,
                  });
                });
            })
            .catch((error) => {
              res.status(400).send(error);
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

// Get List of Projects
router.get(
  "/",
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
        Project.findAndCountAll({
          limit,
          offset,
          attributes: [
            "id",
            "proj_title",
            "proj_description",
            "proj_period",
            "CreatedAt",
            getPath(req, "attatchment_file"),
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = proj_id)`
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
                [
                  Sequelize.fn(
                    "concat",
                    req.headers.host,
                    "/",
                    Sequelize.col("owner.imgPath")
                  ),
                  "avatar",
                ],
              ],
            },
            {
              model: Category,
              attributes: ["cat_name", getPath(req, "cat_img")],
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
//         res.status(403).send(error);
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
                  attatchment_file: req.file?.path || project.attachment_file,
                  proj_status_id:
                    req.body.proj_status_id || project.proj_status_id,
                },
                {
                  where: {
                    id: req.params.id,
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
                `(SELECT COUNT(*) FROM projectoffers AS offer WHERE offer.proj_id = proj_id)`
              ),
              "OffersCount",
            ],
          ],
          include: [
            {
              model: Category,
              attributes: ["cat_name", getPath(req, "cat_img")],
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
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
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
          ],
          include: [
            {
              model: User,
              as: "owner",
              attributes: [
                "fullname",
                [
                  Sequelize.fn(
                    "concat",
                    req.headers.host,
                    "/",
                    Sequelize.col("owner.imgPath")
                  ),
                  "avatar",
                ],
              ],
              //attributes: ["fullname"],
            },
            {
              model: Category,
              attributes: ["cat_name", getPath(req, "cat_img")],
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
              ],
              include: [
                {
                  model: User,
                  as: "client",
                  attributes: [
                    "fullname",
                    [
                      Sequelize.fn(
                        "concat",
                        req.headers.host,
                        "/",
                        Sequelize.col("projectoffers.client.imgPath")
                      ),
                      "avatar",
                    ],
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

module.exports = router;

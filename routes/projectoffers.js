const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  User,
  UserProfile,
  ProjectOffer,
  UserCredentials,
  Project,
  sequelize,
  ProjStatus,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");
const { getCurrentRate } = require("../utils/commissions");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") +
        "proj_offer_" +
        file.originalname
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

// Create a new Project Offer
router.post(
  "/",
  upload.single("OfferAttach"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "project_offer_add")
      .then((rolePerm) => {
        if (
          !req.body.proj_id ||
          !req.body.price ||
          !req.body.days_to_deliver ||
          !req.body.message_desc
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          UserCredentials.findOne({ where: { user_id: req.user?.id } })
            .then((credential) => {
              if (credential?.is_authorized) {
                Project.findOne({ where: { id: req.body.proj_id } })
                  .then((proj) => {
                    if (!proj)
                      return res.status(404).send({ msg: "Project Not Found" });

                    if (proj.user_added_id === req.user?.id)
                      return res
                        .status(400)
                        .send({ msg: "User Cannot add offer to his project!" });

                    const currentRate = getCurrentRate();
                    currentRate
                      .then((rate) => {
                        if (!rate?.id) {
                          return res
                            .status(404)
                            .send({ msg: "Commission Rate is Not Found" });
                        }

                        ProjectOffer.create({
                          proj_id: req.body.proj_id,
                          user_offered_id: req.user.id,
                          price: req.body.price,
                          days_to_deliver: req.body.days_to_deliver,
                          message_desc: req.body.message_desc,
                          pdf_url: req.file?.path,
                          rate_id: rate?.id,
                        })
                          .then((offer) => res.status(201).send(offer))
                          .catch((error) => {
                            res.status(500).send({
                              success: false,
                              msg: error,
                            });
                          });
                      })
                      .catch((err) => res.status(500).send({ msg: err }));
                  })
                  .catch((err) => {
                    res.status(500).send({ msg: err });
                  });
              } else {
                res.status(401).send({
                  msg: "user credentials are not verified",
                });
              }
            })
            .catch((error) => {
              console.log(error);
              res.status(500).send({ msg: error });
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

// Get the Project List of Offers
router.get(
  "/project/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "project_offer_get_all")
      .then((rolePerm) => {
        ProjectOffer.findAndCountAll({
          limit,
          offset,
          // as: "projectoffers",
          attributes: [
            "id",
            "price",
            "days_to_deliver",
            "message_desc",
            "accept_status",
            "createdAt",
            getPath(req, "pdf_url"),
          ],
          include: [
            {
              model: User,
              as: "client",
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getPath(req, "imgPath"),
              ],
              include: {
                model: UserProfile,
                as: "userprofiles",
                attributes: ["about_user", "specialization"],
              },
            },
          ],
          where: {
            proj_id: req.params.id,
          },
          distinct: true,
        })
          .then((offers) =>
            res.status(200).send(getPagingData(offers, page, limit))
          )
          .catch((error) => {
            res.status(400).send({
              success: false,
              msg: error,
            });
          });
      })
      .catch((error) => {
        // console.log(error);
        res.status(403).send({
          success: false,
          msg: error,
        });
      });
  }
);

// update offer status
router.put(
  "/project/status/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "update_offer_status")
      .then((rolePerm) => {
        if (
          !req.params.id ||
          !req.body.projstatus ||
          !req.body.offerstatus ||
          !req.body.proj_id
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          if (req.body.offerstatus) {
            sequelize
              .transaction((t) => {
                // chain all your queries here. make sure you return them.
                return ProjStatus.findOne(
                  {
                    where: {
                      stat_name: req.body.projstatus,
                    },
                  },
                  { transaction: t }
                )
                  .then((stat) => {
                    return Project.update(
                      {
                        proj_status_id: stat.id,
                      },
                      {
                        where: {
                          id: req.body.proj_id,
                        },
                      },
                      { transaction: t }
                    );
                  })
                  .then((_) => {
                    return ProjectOffer.update(
                      {
                        accept_status: req.body.offerstatus,
                      },
                      {
                        where: {
                          id: req.params.id,
                        },
                      },
                      { transaction: t }
                    );
                  });
              })
              .then((_) => {
                // Transaction has been committed
                // result is whatever the result of the promise chain returned to the transaction callback
                res.status(200).send({
                  msg: "Resourse updated",
                });
              })
              .catch((err) => {
                // Transaction has been rolled back
                // err is whatever rejected the promise chain returned to the transaction callback
                res.status(500).send({
                  msg: err,
                });
              });
          } else {
            ProjectOffer.update(
              {
                accept_status: offerstatus,
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
                res.status(500).send({
                  success: false,
                  msg: err,
                })
              );
          }
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

// refrence of transaction with promises
// var members = req.body.members;
//     models.sequelize.transaction(function (t) {
//         var promises = []
//         for (var i = 0; i < members.length; i++) {
//             var newPromise = models.User.create({'firstname':members[i], 'email':members[i], 'pending':true}, {transaction: t});
//            promises.push(newPromise);
//         };
//         return Promise.all(promises).then(function(users) {
//             var userPromises = [];
//             for (var i = 0; i < users.length; i++) {
//                 userPromises.push(users[i].addInvitations([group], {transaction: t});
//             }
//             return Promise.all(userPromises);
//         });
//     }).then(function (result) {
//         console.log("YAY");
//     }).catch(function (err) {
//         console.log("NO!!!");
//         return next(err);
//     });

module.exports = router;

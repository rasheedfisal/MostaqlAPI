const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../models").User;
const UserProfile = require("../models").UserProfile;
const ProjectOffer = require("../models").ProjectOffer;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");
const Sequelize = require("sequelize");

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
          ProjectOffer.create({
            proj_id: req.body.proj_id,
            user_offered_id: req.user.id,
            price: req.body.price,
            days_to_deliver: req.body.days_to_deliver,
            message_desc: req.body.message_desc,
            pdf_url: req.file?.path,
          })
            .then((offer) => res.status(201).send(offer))
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
        // console.log(rolePerm);
        ProjectOffer.findAndCountAll({
          limit,
          offset,
          // as: "projectoffers",
          attributes: [
            "id",
            "price",
            "days_to_deliver",
            "message_desc",
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
          where: {
            proj_id: req.params.id,
          },
          distinct: true,
        })
          .then((offers) =>
            res.status(200).send(getPagingData(offers, page, limit))
          )
          .catch((error) => {
            console.log(error);
            // res.status(400).send({
            //   success: false,
            //   msg: error,
            // });
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

// Update a Project
// router.put(
//   "/:id",
//   passport.authenticate("jwt", {
//     session: false,
//   }),
//   upload.single("ProjectAttach"),
//   function (req, res) {
//     helper
//       .checkPermission(req.user.role_id, "project_update")
//       .then((rolePerm) => {
//         if (
//           !req.params.id ||
//           !req.body.user_added_id ||
//           !req.body.proj_title ||
//           !req.body.proj_description ||
//           !req.body.category_id ||
//           !req.body.price_range_id ||
//           !req.body.proj_period
//         ) {
//           res.status(400).send({
//             msg: "Please pass ID and required fields.",
//           });
//         } else {
//           Project.findByPk(req.params.id)
//             .then((project) => {
//               Project.update(
//                 {
//                   user_added_id:
//                     req.body.user_added_id || project.user_added_id,
//                   proj_title: req.body.proj_title || project.proj_title,
//                   proj_description:
//                     req.body.proj_description || project.proj_description,
//                   category_id: req.body.category_id || project.category_id,
//                   price_range_id:
//                     req.body.price_range_id || project.price_range_id,
//                   proj_period: req.body.proj_period || project.proj_period,
//                   attachment_file: req.file?.path || project.attachment_file,
//                   proj_status_id:
//                     req.body.proj_status_id || project.proj_status_id,
//                 },
//                 {
//                   where: {
//                     id: req.params.id,
//                   },
//                 }
//               )
//                 .then((_) => {
//                   res.status(200).send({
//                     message: "Resourse updated",
//                   });
//                 })
//                 .catch((err) =>
//                   res.status(400).send({
//                     success: false,
//                     msg: err,
//                   })
//                 );
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

// // Delete a Project
// router.delete(
//   "/:id",
//   passport.authenticate("jwt", {
//     session: false,
//   }),
//   function (req, res) {
//     helper
//       .checkPermission(req.user.role_id, "project_delete")
//       .then((rolePerm) => {
//         if (!req.params.id) {
//           res.status(400).send({
//             msg: "Please pass resourse ID.",
//           });
//         } else {
//           Project.findByPk(req.params.id)
//             .then((role) => {
//               if (role) {
//                 Project.destroy({
//                   where: {
//                     id: req.params.id,
//                   },
//                 })
//                   .then((_) => {
//                     res.status(200).send({
//                       message: "Resourse deleted",
//                     });
//                   })
//                   .catch((err) => res.status(400).send(err));
//               } else {
//                 res.status(404).send({
//                   message: "Resourse not found",
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

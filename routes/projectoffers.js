const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  User,
  UserProfile,
  UserWallet,
  ProjectOffer,
  UserCredentials,
  Project,
  sequelize,
  ProjStatus,
  ProjectCompletedRequest,
  Notification,
  ReadNotification,
  CommissionRate,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath } = require("../utils/fileUrl");
const { getCurrentRate } = require("../utils/commissions");
const { sendNotification } = require("../utils/advanceNotifier");
const { QueryTypes } = require("sequelize");
const { handleForbidden, handleResponse } = require("../utils/handleError");

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
                        } else {
                          sequelize
                            .query(
                              "select count(*) as isEngineer from users where role_id in(select a.id from roles as a " +
                                "inner join rolepermissions as ro on a.id = ro.role_id " +
                                "inner join permissions as p on ro.perm_id = p.id " +
                                "where p.perm_name = 'is_enginner') and id=:uId",
                              {
                                replacements: { uId: req.user.id },
                                type: QueryTypes.SELECT,
                              }
                            )
                            .then((count) => {
                              if (count[0].isEngineer > 0) {
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
                              } else {
                                res.status(400).send({
                                  success: false,
                                  msg: "User is not an Engineer",
                                });
                              }
                            })
                            .catch((error) => {
                              res.status(500).send({
                                success: false,
                                msg: error,
                              });
                            });
                        }
                      })
                      .catch((err) => {
                        console.log(err);
                        res.status(500).send({ msg: err });
                      });
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

// Update Offer
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "project_offer_update");

      if (!req.params.id || !req.body.price)
        return handleResponse(
          res,
          "missing fields please add required info.",
          400
        );

      const offer = await ProjectOffer.findOne({
        include: [
          {
            model: Project,
            include: {
              model: User,
              as: "owner",
              include: {
                model: UserWallet,
                as: "wallet",
              },
            },
          },
          {
            model: CommissionRate,
            as: "commissionRate",
          },
        ],
        where: {
          id: req.params.id,
        },
      });
      if (offer.user_added_id !== req.user.id)
        return handleResponse(res, "This User is Not the Project Owner.", 400);
      if (offer.Project.owner.wallet === null)
        return handleResponse(res, "Wallet is Empty.", 400);

      const ratePercent = offer.commissionRate.ratepercent;
      const discountAmount = (offer.price * ratePercent) / 100;
      const fullAmount = req.body.price + discountAmount;
      if (offer.Project.owner.wallet?.credit < fullAmount)
        return handleResponse(res, "Credit is Insufficient.", 400);
      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.

        await ProjectOffer.update(
          {
            price: req.body.price,
          },
          {
            where: {
              id: offer.id,
            },
          },
          { transaction: t }
        );
        const user = sequelize.query(
          "select * from users where id = (select user_offered_id from projectoffers where id= :reqId)",
          {
            replacements: { reqId: offer.id },
            type: QueryTypes.SELECT,
            model: User,
            mapToModel: true,
          },
          { transaction: t }
        );
        const proj = await Project.findByPk(offer.proj_id, {
          transaction: t,
        });
        const notify = await Notification.create(
          {
            title: "Owner Changed Price",
            description: `hello ${user[0].fullname} project owner ${req.user.fullname} changed your offer price for project ${proj.proj_title} the price is now ${req.body.price}`,
            type: "user-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );
        await ReadNotification.create(
          {
            notification_id: notify.id,
            receiver_id: user[0].id,
          },
          { transaction: t }
        );

        await sendNotification(notify.title, notify.description, user[0].email);

        return handleResponse(res, "Resource Updated Successfully.", 200);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
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

// update offer inprogress status
router.put(
  "/project/inprogress/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "update_offer_status");

      if (!req.params.id || !req.body.proj_id)
        return handleResponse(
          res,
          "missing fields please add required info.",
          400
        );

      const offer = await ProjectOffer.findOne({
        include: [
          {
            model: Project,
            include: {
              model: User,
              as: "owner",
              include: {
                model: UserWallet,
                as: "wallet",
              },
            },
          },
          {
            model: CommissionRate,
            as: "commissionRate",
          },
        ],
        where: {
          id: req.params.id,
        },
      });

      if (offer.Project.owner.wallet === null)
        return handleResponse(res, "Wallet is Empty.", 400);

      const ratePercent = offer.commissionRate.ratepercent;
      const discountAmount = (offer.price * ratePercent) / 100;
      const fullAmount = offer.price + discountAmount;

      if (+offer.Project.owner.wallet?.credit < fullAmount)
        return handleResponse(res, "Credit is Insufficient.", 400);
      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const stat = await ProjStatus.findOne(
          {
            where: {
              stat_name: "In-Progress",
            },
          },
          { transaction: t }
        );
        await Project.update(
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
        await ProjectOffer.update(
          {
            accept_status: false,
          },
          {
            where: {
              proj_id: req.body.proj_id,
            },
          },
          { transaction: t }
        );
        await ProjectOffer.update(
          {
            accept_status: true,
          },
          {
            where: {
              id: req.params.id,
            },
          },
          { transaction: t }
        );
        const user = await sequelize.query(
          "select * from users where id = (select user_offered_id from projectoffers where id= :reqId)",
          {
            replacements: { reqId: req.params.id },
            type: QueryTypes.SELECT,
            model: User,
            mapToModel: true,
          },
          { transaction: t }
        );
        const proj = await Project.findByPk(req.body.proj_id, {
          transaction: t,
        });
        const notify = await Notification.create(
          {
            title: "Project In Progress",
            description: `congratulations ${user[0].fullname} project owner ${req.user.fullname} choosed you for project ${proj.proj_title} get ready`,
            type: "user-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );
        await ReadNotification.create(
          {
            notification_id: notify.id,
            receiver_id: user[0].id,
          },
          { transaction: t }
        );

        await sendNotification(notify.title, notify.description, user[0].email);

        return handleResponse(res, "Resource Updated Successfully.", 200);
      });
    } catch (error) {
      console.log(error);
      return handleForbidden(res, error);
    }
  }
);
// update offer complete status
router.put(
  "/project/complete/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "update_offer_status");

      if (!req.params.id)
        return handleResponse(
          res,
          "missing fields please add required info.",
          400
        );

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const stat = await ProjStatus.findOne(
          {
            where: {
              stat_name: "Completed",
            },
          },
          { transaction: t }
        );

        await Project.update(
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
        const offer = await ProjectOffer.findOne(
          {
            where: {
              proj_id: req.params.id,
              accept_status: true,
            },
          },
          { transaction: t }
        );
        await ProjectCompletedRequest.create(
          {
            proj_id: req.params.id,
            offer_id: offer.id,
          },
          { transaction: t }
        );

        const user = await sequelize.query(
          "select * from users where id = (select user_offered_id from projectoffers where id= :reqId)",
          {
            replacements: { reqId: offer.id },
            type: QueryTypes.SELECT,
            model: User,
            mapToModel: true,
          },
          { transaction: t }
        );
        const proj = await Project.findByPk(req.params.id, { transaction: t });
        const notify = await Notification.create(
          {
            title: "Project Completed",
            description: `congratulations ${user[0].fullname} project owner ${req.user.fullname} marked project ${proj.proj_title} as completed please wait for the authorized personnel to validate the project details, please check the project complete request page`,
            type: "user-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );

        await ReadNotification.create(
          {
            notification_id: notify.id,
            receiver_id: user[0].id,
          },
          { transaction: t }
        );

        await sendNotification(notify.title, notify.description, user[0].email);

        return handleResponse(res, "Resource Updated Successfully.", 200);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
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

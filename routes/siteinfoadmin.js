const express = require("express");
const router = express.Router();
const {
  ContactUs,
  PaypalSetting,
  PrivacyPolicy,
  WithdrawableAmountSetting,
  AdminCardInfo,
  sequelize,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { QueryTypes } = require("sequelize");

/////// paypal /////////
router.post(
  "/paypal",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "paypal_email_setting")
      .then((rolePerm) => {
        if (!req.body.email) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          PaypalSetting.destroy({
            where: {},
          })
            .then((_) => {
              PaypalSetting.create({
                email: req.body.email,
              })
                .then((_) => res.status(200).send({ msg: "Resourse updated" }))
                .catch((error) =>
                  res.status(500).send({
                    success: false,
                    msg: error,
                  })
                );
            })
            .catch((error) => {
              res.status(500).send({
                success: false,
                msg: error,
              });
            });
        }
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

//////////// privacy policy ///////////
router.post(
  "/privacy",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "privacy_policy_setting")
      .then((rolePerm) => {
        if (!req.body.description) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          PrivacyPolicy.destroy({
            where: {},
          })
            .then((_) => {
              PrivacyPolicy.create({
                description: req.body.description,
              })
                .then((_) => res.status(200).send({ msg: "Resourse updated" }))
                .catch((error) =>
                  res.status(500).send({
                    success: false,
                    msg: error,
                  })
                );
            })
            .catch((error) => {
              res.status(500).send({
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

///////// withdrawable amount //////////
router.post(
  "/withdraw",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "withdraw_amount_setting")
      .then((rolePerm) => {
        if (!req.body.amount) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          WithdrawableAmountSetting.destroy({
            where: {},
          })
            .then((_) => {
              WithdrawableAmountSetting.create({
                amount: req.body.amount,
              })
                .then((_) => res.status(200).send({ msg: "Resourse updated" }))
                .then((error) =>
                  res.status(500).send({
                    success: false,
                    msg: error,
                  })
                );
            })
            .catch((error) => {
              res.status(500).send({
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

/////////// contact us //////////
router.post(
  "/contact",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "contactus_setting")
      .then((rolePerm) => {
        ContactUs.destroy({
          where: {},
        })
          .then((_) => {
            ContactUs.create({
              website_link: req.body.website_link,
              phone: req.body.phone,
              email: req.body.email,
            })
              .then((_) => res.status(200).send({ msg: "Resourse updated" }))
              .catch((err) =>
                res.status(500).send({
                  success: false,
                  msg: err,
                })
              );
          })
          .catch((error) => {
            res.status(500).send({
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

/////////// Credit Card //////////
router.post(
  "/creditcard",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "creditcard_setting")
      .then((rolePerm) => {
        AdminCardInfo.destroy({
          where: {},
        })
          .then((_) => {
            AdminCardInfo.create({
              name: req.body.name,
              number: req.body.number,
              expiry: req.body.expiry,
              cvc: req.body.cvc,
              issuer: req.body.issuer,
            })
              .then((_) => res.status(200).send({ msg: "Resourse updated" }))
              .catch((err) =>
                res.status(500).send({
                  success: false,
                  msg: err,
                })
              );
          })
          .catch((error) => {
            res.status(500).send({
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

router.get(
  "/creditcard",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "creditcard_setting")
      .then((rolePerm) => {
        AdminCardInfo.findOne()
          .then((card) => res.status(200).send(card))
          .catch((error) => {
            res.status(500).send({
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

// get admin statistics
router.get(
  "/statistics",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(req.user.role_id, "can_access_dashboard");

      const query = `
      select (select count(*) from commissionrates where iscurrent=1) as 'currentCommision', (select count(*) from projects where proj_status_id=(select projstatuses where stat_name='In-Progress' limit 1)) as 'ongoingProjects', (select count(*) from projects where proj_status_id=(select projstatuses where stat_name='Open' limit 1)) as 'openProjects', (select count(*) from projects where proj_status_id=(select projstatuses where stat_name='Completed' limit 1)) as 'completedProjects', (select count(*) from projects where proj_status_id=(select projstatuses where stat_name='Closed' limit 1)) as 'closedProjects', (select count(*) from projectcloserequests) as 'closedProjectRequests', (select count(*) from projectcompletedrequests) as 'completedProjectRequests', (select count(*) from useraccountfeedrequest) as 'accountFeedRequests', (select count(*) from userwithdrawalrequest) as 'moneyWithdrawalRequests'
      `;

      const statistics = await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).send(statistics);
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

module.exports = router;

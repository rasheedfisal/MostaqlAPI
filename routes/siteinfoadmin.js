const express = require("express");
const router = express.Router();
const {
  ContactUs,
  PaypalSetting,
  PrivacyPolicy,
  WithdrawableAmountSetting,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

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
          PaypalSetting.upsert({
            email: req.body.email,
          })
            .then(([item, created]) =>
              res.status(200).send({ msg: "Resourse updated" })
            )
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
          PrivacyPolicy.upsert({
            description: req.body.description,
          })
            .then(([item, created]) =>
              res.status(200).send({ msg: "Resourse updated" })
            )
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
          WithdrawableAmountSetting.upsert({
            amount: req.body.amount,
          })
            .then(([item, created]) =>
              res.status(200).send({ msg: "Resourse updated" })
            )
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
        ContactUs.upsert({
          website_link: req.body.website_link,
          phone: req.body.phone,
          email: req.body.email,
        })
          .then(([item, created]) =>
            res.status(200).send({ msg: "Resourse updated" })
          )
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

module.exports = router;

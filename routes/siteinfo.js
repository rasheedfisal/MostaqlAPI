const express = require("express");
const router = express.Router();
const {
  ContactUs,
  PaypalSetting,
  PrivacyPolicy,
  WithdrawableAmountSetting,
  CommissionRate,
  AdminCardInfo,
} = require("../models");

/////// paypal /////////
router.get("/paypal", function (req, res) {
  PaypalSetting.findOne()
    .then((item) => res.status(200).send(item))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});

//////////// privacy policy ///////////
router.get("/privacy", function (req, res) {
  PrivacyPolicy.findOne()
    .then((item) => res.status(200).send(item))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});

///////// withdrawable amount //////////
router.get("/withdraw", function (req, res) {
  WithdrawableAmountSetting.findOne()
    .then((item) => res.status(200).send(item))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});

/////////// contact us //////////
router.get("/contact", function (req, res) {
  ContactUs.findOne()
    .then((item) => res.status(200).send(item))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});
/////////// current commission rate //////////
router.get("/currentrate", function (req, res) {
  CommissionRate.findOne({ where: { iscurrent: true } })
    .then((rate) => res.status(200).send(rate))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});
/////////// credit card info //////////
router.get("/creditcard", function (req, res) {
  AdminCardInfo.findOne({
    attributes: ["name", "number"],
  })
    .then((card) => res.status(200).send(card))
    .catch((error) => {
      res.status(500).send({
        success: false,
        msg: error,
      });
    });
});

module.exports = router;

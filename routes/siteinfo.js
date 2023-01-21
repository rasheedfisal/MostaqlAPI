const express = require("express");
const router = express.Router();
const {
  ContactUs,
  PaypallSetting,
  PrivacyPolicy,
  WithdrawableAmountSetting,
} = require("../models");

/////// paypal /////////
router.get("/paypal", function (req, res) {
  PaypallSetting.findOne()
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

module.exports = router;

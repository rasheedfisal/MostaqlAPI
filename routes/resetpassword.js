const express = require("express");
const router = express.Router();
const { User, ResetPassword, sequelize } = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { sendResetPassword } = require("../utils/advanceMailer");
const bcrypt = require("bcryptjs");
// password recovery by email
router.post("/", function (req, res) {
  if (!req.body.email) {
    res.status(400).send({
      msg: "missing fields please add required info.",
    });
  } else {
    User.findOne({
      where: {
        email: req.body.email,
      },
    })
      .then((user) => {
        if (!user) {
          res.status(404).send({ msg: "User Not Found" });
        }
        ResetPassword.create({
          user_id: user.id,
        })
          .then((reset) => {
            sendResetPassword(req, user, reset.reset_key)
              .then((_) => {
                return res
                  .status(200)
                  .send({ msg: "Email Was Sent To Your Account" });
              })
              .catch((err) => {
                return res.status(500).send({ msg: err });
              });
          })
          .catch((err) => res.status(500).send({ msg: err }));
      })
      .catch((err) => res.status(500).send({ msg: err }));
  }
});

// user reset password
router.post("/user", function (req, res) {
  if (!req.body.userId || !req.body.resetId || !req.body.password) {
    res.status(400).send({
      msg: "missing fields please add required info.",
    });
  } else {
    sequelize
      .transaction((t) => {
        // chain all your queries here. make sure you return them.
        return ResetPassword.findOne(
          {
            where: {
              user_id: req.body.userId,
              reset_key: req.body.resetId,
            },
          },
          { transaction: t }
        )
          .then((reset) => {
            return User.update(
              {
                password: bcrypt.hashSync(
                  req.body.password,
                  bcrypt.genSaltSync(10),
                  null
                ),
              },
              {
                where: {
                  id: reset.user_id,
                },
              },
              { transaction: t }
            );
          })
          .then((_) => {
            return ResetPassword.destroy(
              {
                where: {
                  user_id: req.body.userId,
                  reset_key: req.body.resetId,
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
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { CommissionRate } = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

// Create a Commssion Rate
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "commission_rate_add")
      .then((rolePerm) => {
        if (!req.body.ratepercent || !req.body.iscurrent) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          if (req.body.iscurrent) {
            CommissionRate.update({ iscurrent: 0 }, { where: {} })
              .then((_) => console.log("updated"))
              .catch((err) => console.log(err));
          }
          CommissionRate.create({
            ratepercent: req.body.ratepercent,
            iscurrent: req.body.iscurrent,
          })
            .then((rate) => res.status(201).send(rate))
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

// Get List of commission Rate
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "commission_rate_get_all")
      .then((rolePerm) => {
        // console.log(rolePerm);
        CommissionRate.findAll({
          order: [["createdAt", "DESC"]],
        })
          .then((rates) => res.status(200).send(rates))
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

// Get Commission Rate by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "commission_rate_get")
      .then((rolePerm) => {
        CommissionRate.findByPk(req.params.id)
          .then((rate) => res.status(200).send(rate))
          .catch((error) => {
            res.status(400).send({
              success: false,
              msg: error,
            });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Update a Commission Rate
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "commission_rate_update")
      .then((rolePerm) => {
        if (!req.params.id || !req.body.ratepercent || !req.body.iscurrent) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          CommissionRate.findByPk(req.params.id)
            .then((rate) => {
              if (req.body.iscurrent) {
                CommissionRate.update({ iscurrent: false })
                  .then((_) => console.log("updated"))
                  .catch((err) => console.log(err));
              }
              CommissionRate.update(
                {
                  ratepercent: req.body.ratepercent || rate.ratepercent,
                  iscurrent: req.body.iscurrent || rate.iscurrent,
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

// Delete a Commission Rate
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "commission_rate_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          CommissionRate.findByPk(req.params.id)
            .then((rate) => {
              if (rate) {
                CommissionRate.destroy({
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

module.exports = router;

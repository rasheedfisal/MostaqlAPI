const express = require("express");
const router = express.Router();
const PriceRange = require("../models").PriceRange;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

// Create a new Price Range
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "range_add")
      .then((rolePerm) => {
        if (
          !req.body.range_name ||
          !req.body.range_from ||
          !req.body.range_to
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          PriceRange.create({
            range_name: req.body.range_name,
            range_from: req.body.range_from,
            range_to: req.body.range_to,
          })
            .then((range) => res.status(201).send(range))
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

// Get List of Price Ranges
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "range_get_all")
      .then((rolePerm) => {
        console.log(rolePerm);
        PriceRange.findAll({
          attributes: ["id", "range_name", "range_from", "range_to"],
        })
          .then((ranges) => res.status(200).send(ranges))
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

// Get Range by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "range_get")
      .then((rolePerm) => {})
      .catch((error) => {
        res.status(403).send(error);
      });
    PriceRange.findByPk(req.params.id)
      .then((range) => res.status(200).send(range))
      .catch((error) => {
        res.status(400).send({
          success: false,
          msg: error,
        });
      });
  }
);

// Update a Range
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "range_update")
      .then((rolePerm) => {
        if (
          !req.params.id ||
          !req.body.range_name ||
          !req.body.range_from ||
          !req.body.range_to
        ) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          PriceRange.findByPk(req.params.id)
            .then((range) => {
              PriceRange.update(
                {
                  range_name: req.body.range_name || range.range_name,
                  range_from: req.body.range_from || range.range_from,
                  range_to: req.body.range_to || range.range_to,
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

// Delete a Range
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "range_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          PriceRange.findByPk(req.params.id)
            .then((range) => {
              if (range) {
                PriceRange.destroy({
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

module.exports = router;

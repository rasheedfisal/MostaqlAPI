const express = require("express");
const router = express.Router();
const { CommonQuestions } = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

// Create a Common Question
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "common_questions_add")
      .then((rolePerm) => {
        if (!req.body.question || !req.body.answer || !req.body.order_no) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          CommonQuestions.create({
            question: req.body.question,
            answer: req.body.answer,
            order_no: req.body.order_no,
          })
            .then((common) => res.status(201).send(common))
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

// Get List of Common Questions
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "common_questions_get_all")
      .then((rolePerm) => {
        // console.log(rolePerm);
        CommonQuestions.findAll({
          order: [["order_no", "ASC"]],
        })
          .then((commons) => res.status(200).send(commons))
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

// Get Common Questions by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "common_questions_get")
      .then((rolePerm) => {
        CommonQuestions.findByPk(req.params.id)
          .then((common) => res.status(200).send(common))
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

// Update a Common Questions
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "common_questions_update")
      .then((rolePerm) => {
        if (
          !req.params.id ||
          !req.body.question ||
          !req.body.answer ||
          !req.body.order_no
        ) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          CommonQuestions.findByPk(req.params.id)
            .then((common) => {
              CommonQuestions.update(
                {
                  question: req.body.question || common.question,
                  answer: req.body.answer || common.answer,
                  order_no: req.body.order_no || common.order_no,
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

// Delete a Common Questions
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "common_questions_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          CommonQuestions.findByPk(req.params.id)
            .then((common) => {
              if (common) {
                CommonQuestions.destroy({
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

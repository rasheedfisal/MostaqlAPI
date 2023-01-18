const express = require("express");
const router = express.Router();
const { UserReviews, User } = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

// add review
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "review_add")
      .then((rolePerm) => {
        if (
          !req.body.talent_id ||
          !req.body.comment ||
          !req.body.star_rate ||
          !req.body.proj_id
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          UserReviews.create({
            owner_id: req.user?.id,
            talent_id: req.body.talent_id,
            comment: req.body.comment,
            star_rate: req.body.star_rate,
            proj_id: req.body.proj_id,
          })
            .then((review) => res.status(201).send(review))
            .catch((err) => res.status(500).send({ msg: err }));
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

// Get List of Talent Reviews
router.get(
  "/talent",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "reviews_talent_get_all")
      .then((rolePerm) => {
        UserReviews.findAll(
          {
            include: [
              {
                model: User,
                as: "owner",
              },
            ],
          },
          { where: { talent_id: req.user?.id } }
        )
          .then((reviews) => res.status(200).send(reviews))
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

// Get User Review by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "review_get")
      .then((rolePerm) => {})
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
    UserReviews.findOne({
      where: {
        id: req.params.id,
      },
    })
      .then((review) => res.status(200).send(review))
      .catch((error) => {
        res.status(400).send({
          success: false,
          msg: error,
        });
      });
  }
);

// Update a Review
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "review_update")
      .then((rolePerm) => {
        if (!req.params?.id) {
          res.status(400).send({
            msg: "Please pass required fields.",
          });
        } else {
          UserReviews.findByPk(req.params.id)
            .then((review) => {
              if (!review)
                return res.status(404).send({ msg: "review Not Found" });

              UserReviews.update(
                {
                  comment: req.body?.comment || review.comment,
                  star_rate: req.body?.star_rate || review.star_rate,
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

// Delete a review
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "review_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          UserReviews.findOne({
            where: {
              id: req.params.id,
            },
          })
            .then((review) => {
              if (review) {
                UserReviews.destroy({
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

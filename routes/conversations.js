const express = require("express");
const router = express.Router();
const Conversation = require("../models").Conversation;
const passport = require("passport");
const multer = require("multer");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { Op } = require("sequelize");
// Create a new Conversation
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "conversation_add")
      .then((rolePerm) => {
        if (!req.body.sender_id || !req.body.receiver_id || !req.body.message) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          Conversation.create({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message,
          })
            .then((conversations) => res.status(201).send(conversations))
            .catch((error) => {
              console.log(error);
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

// Get List of User Conversation
router.get(
  "/chat",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "user_conversation_get_all")
      .then((rolePerm) => {
        Conversation.findAll({
          where: {
            [Op.or]: [
              { sender_id: req.body.sender_id },
              { sender_id: req.body.receiver_id },
              { receiver_id: req.body.sender_id },
              { receiver_id: req.body.receiver_id },
            ],
          },
        })
          .then((conversations) => res.status(200).send(conversations))
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

module.exports = router;

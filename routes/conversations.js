const express = require("express");
const router = express.Router();
const Conversation = require("../models").Conversation;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { Op } = require("sequelize");
const { getPagination, getPagingData } = require("../utils/pagination");
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
        if (!req.body.receiver_id || !req.body.message) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          Conversation.create({
            sender_id: req.user?.id,
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
router.post(
  "/chat",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "user_conversation_get_all")
      .then((rolePerm) => {
        Conversation.findAndCountAll({
          limit,
          offset,
          where: {
            // [Op.or]: [
            //   { sender_id: req.user?.id },
            //   { sender_id: req.body.receiver_id },
            //   { receiver_id: req.user?.id },
            //   { receiver_id: req.body.receiver_id },
            // ],
            // [Op.and]: {
            //   [Op.or]: [
            //     { sender_id: req.user?.id },
            //     { sender_id: req.body.receiver_id },
            //   ],
            //   // { sender_id: req.user?.id },
            //   // { sender_id: req.body.receiver_id },
            //   [Op.or]: [
            //     { receiver_id: req.user?.id },
            //     { receiver_id: req.body.receiver_id },
            //   ],
            // },
            sender_id: {
              [Op.or]: [req.body.receiver_id, req.user?.id],
            },
            receiver_id: {
              [Op.or]: [req.user?.id, req.body.receiver_id],
            },
          },
          // distinct: true,
          order: [["createdAt", "DESC"]],
        })
          .then((conversations) =>
            res.status(200).send(getPagingData(conversations, page, limit))
          )
          .catch((error) => {
            console.log(error);
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

module.exports = router;

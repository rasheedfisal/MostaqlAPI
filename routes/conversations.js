const express = require("express");
const router = express.Router();
const { Conversation, sequelize, User } = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { Op } = require("sequelize");
const { getPagination, getPagingData } = require("../utils/pagination");
const { handleForbidden, handleResponse } = require("../utils/handleError");
const { QueryTypes } = require("sequelize");
const multer = require("multer");
const { getPath, getNestedPath } = require("../utils/fileUrl");
const { sendNotification } = require("../utils/advanceNotifier");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") + "use_" + file.originalname
    );
  },
});
const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});
// Create a new Conversation
router.post(
  "/",
  upload.single("attachment"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "conversation_add")
      .then((rolePerm) => {
        if (
          !req.body.receiver_id ||
          !req.body.message ||
          !req.body.message_type
        ) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          Conversation.create({
            sender_id: req.user?.id,
            receiver_id: req.body.receiver_id,
            message: req.file?.path ? req.file?.path : req.body.message,
            message_type: req.body.message_type,
          })
            .then((conversations) => {
              Conversation.findByPk(conversations.id, {
                attributes: [
                  "sender_id",
                  "receiver_id",
                  "message",
                  "message_type",
                  getNestedPath(req, "message", "fileUrl"),
                  "createdAt",
                ],
                include: {
                  model: User,
                  as: "receiver",
                },
              })
                .then((c) => {
                  sendNotification(
                    "New Message",
                    c.message_type === "text"
                      ? c.message
                      : c.message_type === "image"
                      ? "view image"
                      : c.message_type === "file"
                      ? "view document"
                      : "message undefined",
                    c.receiver.id
                  )
                    .then((_) => console.log("sent notification"))
                    .catch((_) => console.log("error not sent"));
                  res.status(201).send(c);
                })
                .catch((err) => {
                  console.log(err);
                  res.status(500).send({ msg: err });
                });
            })
            .catch((error) => {
              console.log(error);
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
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
          attributes: [
            "sender_id",
            "receiver_id",
            "message",
            "message_type",
            getNestedPath(req, "message", "fileUrl"),
            "createdAt",
          ],
          where: {
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
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// get Last Conversations
router.post(
  "/lastchats",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      const { page, size, search } = req.query;
      const { limit, offset } = getPagination(page, size);
      await helper.checkPermission(
        req.user.role_id,
        "user_conversation_get_all"
      );
      // const query = `select um.*, sender_name,sender_email, sender_img, reciever_name,reciever_email, reciever_img from (select um.*,su.email as sender_email, su.fullname as sender_name, su.imgPath as sender_img ,ru.email as reciever_email, ru.fullname as reciever_name, ru.imgPath as reciever_img, row_number() over (partition by least(um.sender_id, um.receiver_id), greatest(um.sender_id, um.receiver_id) order by um.createdAt desc) as seqnum from conversations um inner join users su on su.id = um.sender_id inner join users ru on ru.id = um.receiver_id) um where seqnum = 1 and (um.sender_id = "${req.user.id}" or um.receiver_id = "${req.user.id}") and (sender_name like '%${search}%' or reciever_name like '%${search}%') order by um.createdAt desc limit ${offset},${limit};`;

      const query = `
          SELECT 
            um.*, 
            sender.email AS sender_email, 
            sender.fullname AS sender_name, 
            sender.imgPath AS sender_img,
            receiver.email AS receiver_email,
            receiver.fullname AS receiver_name,
            receiver.imgPath AS receiver_img
            FROM 
                conversations um
            INNER JOIN 
                users sender ON sender.id = um.sender_id
            INNER JOIN 
                users receiver ON receiver.id = um.receiver_id
            WHERE
                (
                    um.sender_id = "${req.user.id}" 
                    OR um.receiver_id = "${req.user.id}"
                )
                AND (
                    (sender.fullname LIKE '%${search}%' AND sender.id != "${req.user.id}")
                    OR (receiver.fullname LIKE '%${search}%' AND receiver.id != "${req.user.id}")
                )
                AND um.createdAt = (
                    SELECT MAX(createdAt)
                    FROM conversations
                    WHERE 
                        (conversations.sender_id = um.sender_id AND conversations.receiver_id = um.receiver_id)
                        OR (conversations.sender_id = um.receiver_id AND conversations.receiver_id = um.sender_id)
                )
            ORDER BY 
                um.createdAt DESC
            LIMIT ${offset},${limit};

      `;

      const lastChats = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        model: Conversation,
        mapToModel: true, // pass true here if you have any mapped fields
        nest: true,
        raw: true,
      });

      const queryCount =
        // "select distinct count(a.id) as count from conversations as a " +
        // `where (a.sender_id = '${req.user.id}' or a.receiver_id = '${req.user.id}') order by a.createdAt desc;`;
        `
      SELECT COUNT(*) AS total_record_count
      FROM conversations um
      INNER JOIN users sender ON sender.id = um.sender_id
      INNER JOIN users receiver ON receiver.id = um.receiver_id
      WHERE
        (
            um.sender_id = '${req.user.id}' 
            OR um.receiver_id = '${req.user.id}'
        )
        AND (
            (sender.fullname LIKE '%search_query%' AND sender.id != '${req.user.id}')
            OR (receiver.fullname LIKE '%search_query%' AND receiver.id != '${req.user.id}')
        )
        AND um.createdAt = (
            SELECT MAX(createdAt)
            FROM conversations
            WHERE 
                (conversations.sender_id = um.sender_id AND conversations.receiver_id = um.receiver_id)
                OR (conversations.sender_id = um.receiver_id AND conversations.receiver_id = um.sender_id)
        );

      `;
      const lastchatsCount = await sequelize.query(queryCount, {
        type: QueryTypes.SELECT,
      });
      const pg = {
        count: lastchatsCount[0].total_record_count,
        rows: lastChats,
      };
      return res.status(200).send(getPagingData(pg, page, limit));
    } catch (error) {
      console.log(error);
      return handleForbidden(res, error);
    }
  }
);

module.exports = router;

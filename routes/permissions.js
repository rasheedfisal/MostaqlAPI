const express = require("express");
const router = express.Router();
const Permission = require("../models").Permission;
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const { getPagination, getPagingData } = require("../utils/pagination");

// Create a new permission
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "permissions_add")
      .then((rolePerm) => {
        if (!req.body.perm_name || !req.body.perm_description) {
          res.status(400).send({
            msg: "Please pass permission name or description.",
          });
        } else {
          Permission.create({
            perm_name: req.body.perm_name,
            perm_description: req.body.perm_description,
          })
            .then((perm) => res.status(201).send(perm))
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

// Get List of permissions
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    // const { page, size } = req.query;
    // const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "permissions_get_all")
      .then((rolePerm) => {
        Permission.findAll({
          order: [["perm_description", "ASC"]],
        })
          // Permission.findAndCountAll({ limit, offset })
          .then((perms) => {
            res.status(200).send(perms);
          })
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Update a permission
router.put(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "permissions_update")
      .then((rolePerm) => {
        if (
          !req.params.id ||
          !req.body.perm_name ||
          !req.body.perm_description
        ) {
          res.status(400).send({
            msg: "Please pass permission ID, name or description.",
          });
        } else {
          Permission.findByPk(req.params.id)
            .then((perm) => {
              Permission.update(
                {
                  perm_name: req.body.perm_name || perm.perm_name,
                  perm_description:
                    req.body.perm_description || perm.perm_description,
                },
                {
                  where: {
                    id: req.params.id,
                  },
                }
              )
                .then((_) => {
                  res.status(200).send({
                    msg: "permission updated",
                  });
                })
                .catch((err) => res.status(400).send({ msg: err }));
            })
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Delete a permission
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "permissions_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass permission ID.",
          });
        } else {
          Permission.findByPk(req.params.id)
            .then((perm) => {
              if (perm) {
                perm
                  .destroy({
                    where: {
                      id: req.params.id,
                    },
                  })
                  .then((_) => {
                    res.status(200).send({
                      msg: "permission deleted",
                    });
                  })
                  .catch((err) => res.status(400).send({ msg: err }));
              } else {
                res.status(404).send({
                  msg: "permission not found",
                });
              }
            })
            .catch((error) => {
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const Category = require("../models").Category;
const passport = require("passport");
const multer = require("multer");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") + "cat_" + file.originalname
    );
  },
});

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
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

// Create a new Category
router.post(
  "/",
  upload.single("CategoryImg"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_add")
      .then((rolePerm) => {
        if (!req.body.cat_name || !req.body.cat_description) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          Category.create({
            cat_name: req.body.cat_name,
            cat_img: req.file?.path,
            cat_description: req.body.cat_description,
          })
            .then((category) => res.status(201).send(category))
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

// Get List of Categories
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_get_all")
      .then((rolePerm) => {
        Category.findAll()
          .then((categories) => res.status(200).send(categories))
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

// Get Category by ID
router.get(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_get")
      .then((rolePerm) => {
        Category.findByPk(req.params.id)
          .then((category) => res.status(200).send(category))
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

// Update a Category
router.put(
  "/:id",
  upload.single("CategoryImg"),
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_update")
      .then((rolePerm) => {
        if (!req.body.cat_name || !req.body.cat_description) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          Category.findByPk(req.params.id)
            .then((category) => {
              Category.update(
                {
                  cat_name: req.body.cat_name || category.cat_name,
                  cat_img: req.file?.path || category.cat_img,
                  cat_description:
                    req.body.cat_description || category.cat_description,
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
                .catch((err) => res.status(400).send(err));
            })
            .catch((error) => {
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

// Delete a Category
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_delete")
      .then((rolePerm) => {
        if (!req.params.id) {
          res.status(400).send({
            msg: "Please pass resourse ID.",
          });
        } else {
          Category.findByPk(req.params.id)
            .then((category) => {
              if (category) {
                Category.destroy({
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
              res.status(400).send(error);
            });
        }
      })
      .catch((error) => {
        res.status(403).send(error);
      });
  }
);

module.exports = router;

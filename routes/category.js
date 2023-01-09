const express = require("express");
const router = express.Router();
const { Category, SubCategories } = require("../models");
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
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
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
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
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
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
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
                    msg: "Resourse updated",
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
              res.status(400).send({ msg: error });
            });
        }
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

///////////////////////////////// sub categories ///////////////////////////////////
// Create a new Sub Category
router.post(
  "/subcat/:catid",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_add")
      .then((rolePerm) => {
        if (!req.body.name || !req.params.catid) {
          res.status(400).send({
            msg: "missing fields please add required info.",
          });
        } else {
          SubCategories.create({
            name: req.body.name,
            cat_id: req.params.catid,
          })
            .then((category) => res.status(201).send(category))
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

// Get Sub Categories by Category ID
router.get(
  "/subcat/:catid",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_get")
      .then((rolePerm) => {
        SubCategories.findAll({
          where: {
            cat_id: req.params.catid,
          },
        })
          .then((category) => res.status(200).send(category))
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get Sub Category by ID
router.get(
  "/subcat/get/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_get")
      .then((rolePerm) => {
        SubCategories.findByPk(req.params.id)
          .then((category) => res.status(200).send(category))
          .catch((error) => {
            res.status(400).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Update a Sub Category
router.put(
  "/subcat/update/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "category_update")
      .then((rolePerm) => {
        if (!req.body.name || !req.params.id) {
          res.status(400).send({
            msg: "Please pass ID and required fields.",
          });
        } else {
          SubCategories.findByPk(req.params.id)
            .then((category) => {
              SubCategories.update(
                {
                  name: req.body.name || category.name,
                  cat_id: req.body.cat_id || category.cat_id,
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

// Delete a Sub Category
router.delete(
  "/subcat/delete/:id",
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
          SubCategories.findByPk(req.params.id)
            .then((category) => {
              if (category) {
                SubCategories.destroy({
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

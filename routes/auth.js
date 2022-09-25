const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const router = express.Router();
require("../config/passport")(passport);
const User = require("../models").User;
//const Role = require("../models").Role;

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

router.post("/signup", upload.single("profileImage"), function (req, res) {
  if (!req.body.email || !req.body.password || !req.body.fullname) {
    res.status(400).send({
      msg: "Please pass username, password and name.",
    });
  } else {
    // Role.findOne({
    //   where: {
    //     role_name: "basic",
    //   },
    // })
    //   .then((role) => {
    //console.log(role.id);
    User.create({
      email: req.body.email,
      password: req.body.password,
      fullname: req.body.fullname,
      phone: req.body.phone,
      imgPath: req.file?.path,
      role_id: req.body.id,
    })
      .then((user) => res.status(201).send(user))
      .catch((error) => {
        res.status(400).send(error);
      });
    // })
    // .catch((error) => {
    //   res.status(400).send(error);
    // });
  }
});

router.post("/signin", function (req, res) {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(401).send({
          message: "Authentication failed. User not found.",
        });
      }
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          var token = jwt.sign(
            JSON.parse(JSON.stringify(user)),
            "nodeauthsecret",
            {
              expiresIn: "1d", //86400 * 30 in seconds = 30 days
            }
          );
          jwt.verify(token, "nodeauthsecret", function (err, data) {
            console.log(err, data);
          });
          res.json({
            success: true,
            token: "JWT " + token,
          });
        } else {
          res.status(401).send({
            success: false,
            msg: "Authentication failed. Wrong password.",
          });
        }
      });
    })
    .catch((error) => res.status(400).send(error));
});

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const router = express.Router();
require("../config/passport")(passport);
const User = require("../models").User;
const loginLimiter = require("../middlewares/loginLimiter");
// const Role = require("../models").Role;
const Sequelize = require("sequelize");

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

router.post("/signin", loginLimiter, function (req, res) {
  User.findOne({
    attributes: [
      [Sequelize.col("user.id"), "uid"],
      "email",
      "fullname",
      "password",
      [
        Sequelize.fn("concat", req.headers.host, "/", Sequelize.col("imgPath")),
        "imgPath",
      ],
    ],
    where: {
      email: req.body.email,
    },
    // include: {
    //   model: Role,
    //   attributes: ["id", "role_name"],
    // },
  })
    .then((user) => {
      if (!user) {
        return res.status(401).send({
          message: "Authentication failed. User not found.",
        });
      }
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          let userWithoutPassword = Object.assign(user);
          userWithoutPassword.password = undefined;
          var token = jwt.sign(
            JSON.parse(JSON.stringify(userWithoutPassword)),
            //JSON.parse(JSON.stringify(user)),
            process.env.JWT_SECRET,
            {
              expiresIn: "15m", //86400 * 30 in seconds = 30 days
            }
          );
          const refreshToken = jwt.sign(
            JSON.parse(JSON.stringify(userWithoutPassword)),
            //JSON.parse(JSON.stringify(user)),
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "1h" }
          );

          res.cookie("jwt", refreshToken, {
            httpOnly: true, //accessible only by web server
            secure: true, //https
            sameSite: "None", //cross-site cookie
            maxAge: 60 * 60 * 1000, //7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
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

router.post("/refresh", function (req, res) {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_JWT_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      User.findOne({
        attributes: [
          [Sequelize.col("user.id"), "uid"],
          "email",
          "fullname",
          [
            Sequelize.fn(
              "concat",
              req.headers.host,
              "/",
              Sequelize.col("imgPath")
            ),
            "imgPath",
          ],
        ],
        where: {
          email: decoded.email,
        },
        // include: {
        //   model: Role,
        //   attributes: ["id", "role_name"],
        // },
      })
        .then((user) => {
          if (!user) {
            return res.status(401).send({
              message: "Unauthorized",
            });
          }

          const accessToken = jwt.sign(
            JSON.parse(JSON.stringify(user)),
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
          );

          res.json({
            success: true,
            token: "JWT " + accessToken,
          });
        })
        .catch((error) => res.status(400).send(error));
    }
  );
});

router.post("/signout", function (req, res) {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
});

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const router = express.Router();
require("../config/passport")(passport);
const User = require("../models").User;
const loginLimiter = require("../middlewares/loginLimiter");
const Role = require("../models").Role;
const Permission = require("../models").Permission;
const { getPath } = require("../utils/fileUrl");
//var fs = require("fs");

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

// const base64_encode = (filePath) => {
//   var bitmap = fs.readFileSync(`./${filePath}`);
//   return new Buffer.from(bitmap).toString("base64");
// };

const mergeUserPermissions = (permissions) => {
  let mergedPermission = [];
  for (let i = 0; i < permissions.length; i++) {
    mergedPermission.push(permissions[i].perm_name);
  }

  return mergedPermission;
};

const convertToUserInfoDto = (user) => {
  const userInfoDto = {
    uid: user.id,
    email: user.email,
    fullname: user.fullname,
    imgPath: user.imgPath, //base64_encode(user.imgPath),
    permissions: mergeUserPermissions(user.Role.permissions),
  };
  return userInfoDto;
};

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
    Role.findOne({
      where: {
        role_name: "admin", // TODO: change in the future with non admin role
      },
    })
      .then((role) => {
        //console.log(role.id);
        User.create({
          email: req.body.email,
          password: req.body.password,
          fullname: req.body.fullname,
          phone: req.body.phone,
          imgPath: req.file?.path,
          //role_id: req.body.id,
          role_id: role.id,
        })
          .then((user) => res.status(201).send(user))
          .catch((error) => {
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        res.status(400).send(error);
      });
  }
});

router.post("/signin", loginLimiter, function (req, res) {
  User.findOne({
    attributes: [
      //[Sequelize.col("user.id"), "uid"],
      "id",
      "email",
      "fullname",
      "password",
      "is_active",
      //"imgPath",
      getPath(req, "imgPath"),
    ],
    include: [
      {
        model: Role,
        attributes: ["role_name"],
        nested: false,
        include: {
          model: Permission,
          as: "permissions",
          attributes: ["perm_name"],
          through: {
            attributes: [],
          },
        },
      },
    ],
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
      if (!user.is_active) {
        return res.status(401).send({
          message: "User Account is Locked.",
        });
      }

      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const userDto = convertToUserInfoDto(user);
          var token = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
            process.env.JWT_SECRET,
            {
              expiresIn: "15m", //86400 * 30 in seconds = 30 days
            }
          );
          const refreshToken = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
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
            //token: "JWT " + token,
            token: token,
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
          //[Sequelize.col("user.id"), "uid"],
          "id",
          "email",
          "fullname",
          getPath(req, "imgPath"),
        ],
        include: [
          {
            model: Role,
            attributes: ["role_name"],
            nested: false,
            include: {
              model: Permission,
              as: "permissions",
              attributes: ["perm_name"],
              through: {
                attributes: [],
              },
            },
          },
        ],
        where: {
          email: decoded.email,
        },
      })
        .then((user) => {
          if (!user) {
            return res.status(401).send({
              message: "Unauthorized",
            });
          }

          const accessToken = jwt.sign(
            JSON.parse(JSON.stringify(convertToUserInfoDto(user))),
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

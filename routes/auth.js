const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const router = express.Router();
require("../config/passport")(passport);
// const User  = require("../models").User;
const loginLimiter = require("../middlewares/loginLimiter");
// const Role = require("../models").Role;
// const Permission = require("../models").Permission;
// const UserCredentials = require("../models");
const { getPath } = require("../utils/fileUrl");
const { QueryTypes } = require("sequelize");
const {
  User,
  Role,
  Permission,
  UserCredentials,
  sequelize,
} = require("../models");
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
    // imgPath: user.imgPath, //base64_encode(user.imgPath),
    // permissions: mergeUserPermissions(user.Role.permissions),
  };
  return userInfoDto;
};

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

router.post(
  "/signup",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "Credentials", maxCount: 1 },
  ]),
  async function (req, res) {
    if (
      !req.body.role_id ||
      !req.body.email ||
      !req.body.password ||
      !req.body.fullname ||
      !req.body.phone
    ) {
      res.status(400).send({
        msg: "Please pass Role ID, email, password, phone or fullname.",
      });
    } else {
      try {
        await sequelize.transaction(async function (transaction) {
          const user = await User.create(
            {
              email: req.body.email,
              password: req.body.password,
              fullname: req.body.fullname,
              phone: req.body.phone,
              imgPath:
                req.files?.profileImage && req.files?.profileImage[0]?.path,
              role_id: req.body.role_id,
            },
            { transaction }
          );

          await UserCredentials.create(
            {
              user_id: user.id,
              attachments:
                req.files?.Credentials && req.files?.Credentials[0]?.path,
            },
            { transaction }
          );

          res.status(201).send(user);
        });
      } catch (error) {
        res.status(400).send({ msg: error });
      }

      // User.create({
      //   email: req.body.email,
      //   password: req.body.password,
      //   fullname: req.body.fullname,
      //   phone: req.body.phone,
      //   imgPath: req.files.path,
      //   role_id: req.body.role_id,
      // })
      //   .then((user) => res.status(201).send(user))
      //   .catch((error) => {
      //     console.log(error);
      //     res.status(400).send({ msg: error });
      //   });
    }
  }
);
router.post(
  "/dashboard_signup",
  upload.single("profileImage"),
  function (req, res) {
    if (
      !req.body.role_id ||
      !req.body.email ||
      !req.body.password ||
      !req.body.fullname ||
      !req.body.phone
    ) {
      res.status(400).send({
        msg: "Please pass Role ID, email, password, phone or fullname.",
      });
    } else {
      User.create({
        email: req.body.email,
        password: req.body.password,
        fullname: req.body.fullname,
        phone: req.body.phone,
        imgPath: req.file?.path,
        role_id: req.body.role_id,
      })
        .then((user) => res.status(201).send(user))
        .catch((error) => {
          console.log(error);
          res.status(400).send({ msg: error });
        });
    }
  }
);

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
          msg: "Authentication failed. User not found.",
        });
      }
      if (!user.is_active) {
        return res.status(401).send({
          msg: "User Account is Locked.",
        });
      }

      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const userDto = convertToUserInfoDto(user);
          var token = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
            process.env.JWT_SECRET,
            {
              expiresIn: "1h", //86400 * 30 in seconds = 30 days
            }
          );
          const refreshToken = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "1d" }
          );

          res.cookie("jwt", refreshToken, {
            httpOnly: true, //accessible only by web server
            secure: true, //https
            sameSite: "None", //cross-site cookie
            maxAge: 24 * 60 * 60 * 1000, //7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
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
    .catch((error) => res.status(400).send({ msg: error }));
});
router.post("/dashboard_signin", loginLimiter, function (req, res) {
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
          msg: "Authentication failed. User not found.",
        });
      }
      if (!user.is_active) {
        return res.status(401).send({
          msg: "User Account is Locked.",
        });
      }

      console.log(JSON.stringify(user));

      const hasAccessToDashboard = user.Role.permissions.some(
        (el) => el.perm_name === "can_access_dashboard"
      );

      if (!hasAccessToDashboard) {
        return res.status(401).send({
          msg: "Unauthorized",
        });
      }

      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const userDto = convertToUserInfoDto(user);
          var token = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
            process.env.JWT_SECRET,
            {
              expiresIn: "1h", //86400 * 30 in seconds = 30 days
            }
          );
          const refreshToken = jwt.sign(
            JSON.parse(JSON.stringify(userDto)),
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "1d" }
          );

          res.cookie("jwt", refreshToken, {
            httpOnly: true, //accessible only by web server
            secure: true, //https
            sameSite: "None", //cross-site cookie
            maxAge: 24 * 60 * 60 * 1000, //7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
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
    .catch((error) => res.status(400).send({ msg: error }));
});

router.get("/refresh", function (req, res) {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ msg: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_JWT_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ msg: "Forbidden" });

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
              msg: "Unauthorized",
            });
          }

          const accessToken = jwt.sign(
            JSON.parse(JSON.stringify(convertToUserInfoDto(user))),
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );

          res.json({
            success: true,
            token: accessToken,
          });
        })
        .catch((error) => res.status(400).send({ msg: error }));
    }
  );
});

router.post("/signout", function (req, res) {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ msg: "Cookie cleared" });
});

// Get Non Admin Roles
router.get("/roles", async function (req, res) {
  try {
    const roles = await sequelize.query(
      "select * from roles where id not in(select a.id from roles as a " +
        "inner join rolepermissions as ro on a.id = ro.role_id " +
        "inner join permissions as p on ro.perm_id = p.id " +
        "where p.perm_name = 'can_access_dashboard')",
      {
        // replacements: { perm_name: "can_access_dashboard" },
        type: QueryTypes.SELECT,
        model: Role,
        mapToModel: true, // pass true here if you have any mapped fields
      }
    );
    res.status(200).send(roles);
  } catch (error) {
    res.status(400).send({ msg: error });
  }
});

module.exports = router;

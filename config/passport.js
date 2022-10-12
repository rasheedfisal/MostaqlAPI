const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const Role = require("../models").Role;

// load up the user model
const User = require("../models").User;

module.exports = function (passport) {
  const opts = {
    //jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
    secretOrKey: process.env.JWT_SECRET,
  };
  passport.use(
    "jwt",
    new JwtStrategy(opts, function (jwt_payload, done) {
      User.findByPk(jwt_payload.uid)
        // User.findByPk(jwt_payload.uid, {
        //   include: {
        //     model: Role,
        //     attributes: ["id", "role_name"],
        //   },
        // })
        .then((user) => {
          return done(null, user);
        })
        .catch((error) => {
          return done(error, false);
        });
    })
  );
};

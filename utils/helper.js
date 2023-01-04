const RolePermission = require("../models").RolePermission;
const Permission = require("../models").Permission;

class Helper {
  constructor() {}

  checkPermission(roleId, permName) {
    return new Promise((resolve, reject) => {
      Permission.findOne({
        where: {
          perm_name: permName,
        },
      })
        .then((perm) => {
          RolePermission.findOne({
            where: {
              role_id: roleId,
              perm_id: perm.id,
            },
          })
            .then((rolePermission) => {
              if (rolePermission) {
                resolve(rolePermission);
              } else {
                reject("Forbidden");
              }
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch(() => {
          reject("Forbidden");
        });
    });
  }
}

module.exports = Helper;

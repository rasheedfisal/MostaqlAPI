const { ReadNotification } = require("../models");
const { getAllNonAdminUserIds } = require("./findUsers");

module.exports = {
  bulkInsertReadNotifications: async (notificationId, target, t) => {
    // Get Current Commission Rate
    const userIds = await getAllNonAdminUserIds(t, target);
    let i,
      j,
      temp,
      chunk = 1000;
    let items = [];

    for (i = 0, j = userIds.length; i < j; i += chunk) {
      temp = userIds.slice(i, i + chunk);
      items = temp.map((e) => ({
        notification_id: notificationId,
        receiver_id: e.id,
      }));
      await ReadNotification.bulkCreate(items, { transaction: t });
    }
  },
};

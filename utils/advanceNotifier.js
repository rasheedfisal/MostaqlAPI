module.exports = {
  sendNotification: async (title, description, topic) => {
    const MessageResponse = await fetch(process.env.BASE_NOTIFY_URL, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.NOTIFICATION_KEY_Mostaql,
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        notification: {
          title,
          body: description,
        },
      }),
    });
    if (MessageResponse?.status === 200) {
      console.log(MessageResponse?.data);
    } else {
      console.error("error: message not send");
    }
  },
};

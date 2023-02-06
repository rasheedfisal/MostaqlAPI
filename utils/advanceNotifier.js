var io = require("socket.io-client");

// const skt = io("http://194.195.87.30:89");

const skt = io("http://localhost:3002");

module.exports = {
  sendNotification: async (title, description, topic) => {
    try {
      const MessageResponse = await fetch(process.env.BASE_NOTIFY_URL, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.NOTIFICATION_KEY,
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
        skt.emit("sendNotification", {
          receiverId: topic, //stateContext.chatState.currentChat?.email
          title: title,
          description: description,
        });
        console.log(MessageResponse?.data);
      } else {
        console.error("error: message not send");
      }
    } catch (error) {
      console.error("error: message not send");
    }
  },
};

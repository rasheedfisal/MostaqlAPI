const redis = require("redis");

const port = process.env.REDIS_PORT;
const host = process.env.REDIS_HOST;

const pubClient = redis.createClient({
  socket: {
    host: host,
    port: port,
  },
});

pubClient.on("connect", () => {
  console.log(`[Redis]: Connected to redis server at ${host}:${port}`);
});

module.exports = pubClient;

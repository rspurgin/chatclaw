import { createApp } from "./app.js";
import { config } from "./config.js";

const { server } = createApp();

server.listen(config.port, () => {
  console.info(`Open Claw Chat Server running on http://localhost:${config.port}`);
});

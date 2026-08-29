import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = await createApp();

app.listen(env.PORT, () => {
  logger.info(`Gram Vyapaar backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

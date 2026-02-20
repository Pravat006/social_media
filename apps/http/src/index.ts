import app from "@/app";
import { logger } from "@repo/logger";

import config from "@/config";

// dotenv is already loaded by @repo/env-config

const PORT = config.HTTP_PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    logger.info(`Network access: http://10.85.58.209:${PORT}`);

});


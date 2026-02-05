import app from "@/app";
import * as process from "node:process";
import dotenv from "dotenv";
import { logger } from "./config/logger";

dotenv.config({ path: "./.env" });

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    logger.info(`Network access: http://10.85.58.209:${PORT}`);

});


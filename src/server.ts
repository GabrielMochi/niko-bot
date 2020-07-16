import http from 'http';
import app from 'app';
import logger from 'config/logger';

const port: number = Number(process.env.PORT) || 4567;
const server: http.Server = http.createServer(app);

server.listen(port, (): void => {
  logger.info(`The server is running on port: ${port}`);
});

export default server;

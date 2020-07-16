import socketIo, { Server, Socket } from 'socket.io';
import server from 'server';
import logger from 'config/logger';

const io: Server = socketIo(server);

io.onconnection((socket: Socket): void => {
  logger.info(`[${socket.id}] socket connection accepted`);

  socket.on('disconnect', (): void => {
    logger.info(`[${socket.id}] socket connection closed`);
  });
});

export default io;

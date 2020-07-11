import './config/env';
import MainThread from './engine/MainThread';
import Thread from './engine/Thread';

const instances: number = Number(process.env.INSTANCES);

[...Array(instances).keys()].forEach((index: number): void => {
  const mainThread: Thread = new MainThread(index);
  mainThread.start();
});

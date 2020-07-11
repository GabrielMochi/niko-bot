import WorkerConfig from './WorkerConfig';
import Product from './Product';

export enum WorkerStatus {
  WAITING = 'Waiting',
  RUNNING = 'Running',
  COMPLETED = 'Completed',
  ERROR = 'Error'
}

export default class Worker {

  public id: string;
  public executionSchedule: Date;
  public status: WorkerStatus;
  public config: WorkerConfig;
  public product: Product;

  constructor(
    id: string, executionSchedule: Date, status: WorkerStatus,
    config: WorkerConfig, product: Product
  ) {
    this.id = id;
    this.executionSchedule = executionSchedule;
    this.status = status;
    this.config = config;
    this.product = product;
  }

}

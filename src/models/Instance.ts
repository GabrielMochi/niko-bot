import Credentials from './Credentials';
import Worker from './Worker';
import Purchase from './Purchase';

export enum InstanceStatus {
  OFFLINE = 'Offline',
  ONLINE = 'Online',
  RESTARTING = 'Restarting'
}

export default class Instance {

  public id: string;
  public status: InstanceStatus;
  public credentials: Credentials;
  public workers: Worker[];
  public purchases: Purchase[];

  constructor(
    id: string, status: InstanceStatus, credentials: Credentials,
    workers: Worker[], purchases: Purchase[]
  ) {
    this.id = id;
    this.status = status;
    this.credentials = credentials;
    this.workers = workers;
    this.purchases = purchases;
  }

}

import Worker from './Worker';

export default class Purchase {

  public id: string;
  public date: Date;
  public worker: Worker;

  constructor(id: string, date: Date, worker: Worker) {
    this.id = id;
    this.date = date;
    this.worker = worker;
  }

}

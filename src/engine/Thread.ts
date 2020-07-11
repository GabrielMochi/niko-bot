abstract class Thread {

  public abstract start(): void | Promise<void>;
  public abstract stop(): void | Promise<void>;

}

export default Thread;

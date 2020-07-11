import mongoose, { Connection } from 'mongoose';

class Database {

  public static async loadConnection(): Promise<void> {
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      }
    );
  }

  public static getConnection(): Connection {
    return mongoose.connection;
  }

}

export default Database;

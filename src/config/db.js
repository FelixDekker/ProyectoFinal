import mongoose from 'mongoose';
import { logToConsole } from '../utils/logger.js';

const DB_URL = 'mongodb+srv://dbUser:1q2w3e@cluster0.7kqh6qi.mongodb.net/';

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  logToConsole('error', 'Error de conexión a MongoDB: ' + error);
});

db.once('open', async () => {
  logToConsole('info', 'Conexión exitosa a MongoDB.');
});

export { db };

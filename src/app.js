import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './passport.js';
import ProductService from './dao/services/product.service.js';
import { db } from './config/db.js'; 
import { logToConsole, logToFile } from './utils/logger.js';
import AuthRouter from './routes/authRoutes.js';  
import ProductRouter from './routes/productRouter.js';  
import CartRouter from './routes/cartRouter.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

const mongoUrl = 'mongodb+srv://dbUser:1q2w3e@cluster0.7kqh6qi.mongodb.net/';
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logToConsole('info', 'BDD conectada'))
  .catch((error) =>
    logToConsole('error', 'Error en conexion con MongoDB ATLAS: ' + error)
  );

app.use(
  session({
    secret: 'felix123',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl,
    }),
  })
);

const server = createServer(app);
const io = new Server(server);
const productService = new ProductService();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicDirectory = path.join(__dirname, 'src', 'public');
app.use(express.static(publicDirectory));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(passport.initialize());
app.use(passport.session());

app.get('/mockingproducts', async (req, res) => {
  try {
    const mockProducts = await productService.generateMockProducts(100);
    res.status(200).json(mockProducts);
    logToConsole('debug', 'Mock products generated successfully');
  } catch (error) {
    logToFile('error', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  logToConsole('info', `Server is running on port ${PORT}`);
});

io.on('connection', (socket) => {
  logToConsole('debug', 'A user connected');

  socket.on('disconnect', () => {
    logToConsole('debug', 'User disconnected');
  });

  socket.on('newProduct', async (newProduct) => {
    try {
      const addedProduct = await productService.addProduct(newProduct);
      io.emit('productAdded', addedProduct);
      logToConsole('info', 'New product added');
    } catch (error) {
      logToFile('error', error.message);
      socket.emit('error', { error: 'Internal Server Error' });
    }
  });

  socket.on('deleteProduct', async (productId) => {
    try {
      await productService.deleteProduct(productId);
      io.emit('productDeleted', productId);
      logToConsole('info', `Product deleted: ${productId}`);
    } catch (error) {
      logToFile('error', error.message);
      socket.emit('error', { error: 'Internal Server Error' });
    }
  });
});

app.use('/auth', AuthRouter);
app.use('/api/products', ProductRouter);
app.use('/api/cart', CartRouter);

app.use((err, req, res, next) => {
  logToFile('error', `An error occurred: ${err.message}`);
  logToConsole('error', `An error occurred: ${err.message}`);

  const errorMessage =
    err.message === 'InvalidProductData'
      ? 'Invalid product data'
      : 'Internal Server Error';

  res.status(500).json({ error: errorMessage });
});

export default app;

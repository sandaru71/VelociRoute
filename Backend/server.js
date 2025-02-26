import path from 'path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { connectDB } from './src/Infrastructure/db.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

let db;

// Connect to MongoDB
connectDB().then(database => {
  db = database;
  console.log('🚀 Database Ready!');
}).catch(err => console.error(err));

// Load route modules dynamically to inspect their exports
async function setupRoutes() {
  try {
    const userModule = await import('./src/Routes/userRoute.js');
    const uploadModule = await import('./src/Routes/uploadRoutes.js');
    
    console.log('User module exports:', Object.keys(userModule));
    console.log('Upload module exports:', Object.keys(uploadModule));
    
    // After seeing the console output, you can then set up your routes correctly
    // app.use('/api/users', userModule.???);
    // app.use('/api', uploadModule.???);
    
    const port = process.env.APP_PORT || 5000;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error('Error loading route modules:', error);
  }
}

setupRoutes();
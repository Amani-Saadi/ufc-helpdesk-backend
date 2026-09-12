import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'UFC Help Desk API is running',
    version: '1.0.0',
    endpoints: '/api'
  });
});

// Mount main API routes
app.use('/api', routes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  if (err instanceof TypeError && err.message.includes('Do not know how to serialize a BigInt')) {
    return res.status(500).json({ status: 'error', message: 'Erreur de sérialisation des données.' });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Erreur interne du serveur.',
  });
});

export default app;

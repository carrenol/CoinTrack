import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Ruta básica
app.get('/', (req, res) => {
  res.json({ message: 'MonaBit Crypto API is running!' });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
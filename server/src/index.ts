import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth';
import coinRoutes from './routes/coins.routes';
import adminRoutes from './routes/admin';
import favoritesRoutes from './routes/favorites.routes';
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// === CONEXIÓN CON SUPABASE ===
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

console.log('✅ Supabase client initialized');

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'CoinTrack API is running!',
    status: 'ok'
  });
});

app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    console.error('Error Supabase:', error);

    res.json({
      status: 'ok',
      supabase: error ? 'error' : 'connected',
      profiles_count: data?.[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'ok',
      supabase: 'connection_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
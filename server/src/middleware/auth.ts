import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('⚠️ No Bearer token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token recibido (primeros 30 chars):', token?.substring(0, 30) + '...');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Error en supabase.auth.getUser():', error);
      return res.status(401).json({ 
        error: 'Invalid or expired token', 
        details: error.message 
      });
    }

    if (!user) {
      console.log('⚠️ No user returned from token');
      return res.status(401).json({ error: 'No user found' });
    }

    console.log('✅ Usuario autenticado:', user.email || user.id);
    req.user = user;
    next();
  } catch (error: any) {
    console.error('💥 Excepción en authenticateUser:', error);
    return res.status(500).json({ 
      error: 'Authentication failed', 
      message: error.message 
    });
  }
};
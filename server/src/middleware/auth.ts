import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Cliente admin para leer profiles sin restricciones de RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('⚠️ No Bearer token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

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

    // Verificar si el usuario está activo en la tabla profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('active')
      .eq('id', user.id)
      .single();

    if (profile && profile.active === false) {
      console.log('🚫 Usuario desactivado intentó acceder:', user.email || user.id);
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
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
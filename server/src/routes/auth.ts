import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Obtener perfil del usuario actual
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user?.id)
      .single();

    if (error) throw error;

    res.json({
      user: req.user,
      profile: profile || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil
router.patch('/profile', authenticateUser, async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        full_name, 
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user?.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Profile updated', profile: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
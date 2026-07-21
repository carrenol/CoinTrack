import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

// GET /api/favorites — Obtener favoritos del usuario autenticado
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ favorites: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/favorites — Agregar un favorito
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { coin_id } = req.body;

    if (!coin_id) {
      return res.status(400).json({ error: 'coin_id es requerido' });
    }

    // Evitar duplicados
    const { data: existing } = await supabaseAdmin
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('coin_id', coin_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Ya está en favoritos' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .insert({ user_id: userId, coin_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ favorite: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/favorites/:coin_id — Eliminar un favorito
router.delete('/:coin_id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { coin_id } = req.params;

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('coin_id', coin_id);

    if (error) throw error;
    res.json({ message: 'Favorito eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

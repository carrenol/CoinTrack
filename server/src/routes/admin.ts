import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Cliente de Supabase con permisos de Service Role (Admin)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

// Middleware de admin: consulta el rol en la tabla 'profiles'
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({ error: 'Error al verificar permisos de administrador.' });
  }
};

// Obtener todos los usuarios (solo admin)
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Obtener los datos de auth.users usando la API de admin de Supabase
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const authUsersMap = new Map((authData?.users || []).map(u => [u.id, u]));

    const users = (profiles || []).map(p => ({
      ...p,
      email: p.email || authUsersMap.get(p.id)?.email || 'Sin email'
    }));

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Desactivar / Activar usuario
router.patch('/users/:id/toggle', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ active: !!active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Usuario actualizado', user: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar perfil
    await supabaseAdmin.from('profiles').delete().eq('id', id);
    // Eliminar usuario de auth.users
    await supabaseAdmin.auth.admin.deleteUser(id);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
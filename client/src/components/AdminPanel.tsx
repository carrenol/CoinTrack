import { useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    active?: boolean;
    created_at: string;
}

export default function AdminPanel({ session }: { session: any }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/admin/users', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios');
            setUsers(data.users || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUser = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch(`http://localhost:3001/api/admin/users/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ active: !currentActive })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');
            fetchUsers();
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
            fetchUsers();
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    if (loading) return <p className="text-gray-500 dark:text-gray-400 p-4">Cargando usuarios...</p>;
    if (error) return <p className="text-red-500 dark:text-red-400 p-4">❌ {error}</p>;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                👑 Panel de Administración
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                            <th className="text-left py-3">Usuario</th>
                            <th className="text-left py-3">Email</th>
                            <th className="text-left py-3">Rol</th>
                            <th className="text-left py-3">Estado</th>
                            <th className="text-center py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                <td className="py-4 font-medium">{user.full_name || 'Sin nombre'}</td>
                                <td className="py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                <td className="py-4">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                        {user.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="py-4 text-center space-x-2">
                                    <button
                                        onClick={() => toggleUser(user.id, user.active || false)}
                                        className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition shadow-sm"
                                    >
                                        {user.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
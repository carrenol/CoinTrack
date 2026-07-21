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

    const fetchUsers = async () => {
        const res = await fetch('http://localhost:3001/api/admin/users', {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setUsers(data.users || []);
        setLoading(false);
        console.log('usuarios data', data)

    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUser = async (id: string, currentActive: boolean) => {
        await fetch(`http://localhost:3001/api/admin/users/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ active: !currentActive })
        });
        fetchUsers();
    };

    const deleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        await fetch(`http://localhost:3001/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        fetchUsers();
    };

    if (loading) return <p>Cargando usuarios...</p>;

    return (
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                👑 Panel de Administración
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3">Usuario</th>
                            <th className="text-left py-3">Email</th>
                            <th className="text-left py-3">Rol</th>
                            <th className="text-left py-3">Estado</th>
                            <th className="text-center py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="py-4">{user.full_name || 'Sin nombre'}</td>
                                <td className="py-4 text-gray-400">{user.email}</td>
                                <td className="py-4">
                                    <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {user.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="py-4 text-center space-x-2">
                                    <button
                                        onClick={() => toggleUser(user.id, user.active || false)}
                                        className="px-4 py-1 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-sm"
                                    >
                                        {user.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="px-4 py-1 bg-red-600 hover:bg-red-500 rounded-xl text-sm"
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
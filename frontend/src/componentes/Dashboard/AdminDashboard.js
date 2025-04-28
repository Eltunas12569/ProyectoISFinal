import { useEffect, useState } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [theme, setTheme] = useState('light');
  const [updatingRoles, setUpdatingRoles] = useState({});
  const navigate = useNavigate();

  // Función para alternar entre temas
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      setLoading(true);
      try {
        // Verificar usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error(authError?.message || 'No autenticado');
        }

        // Obtener perfil del usuario actual
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          throw new Error(profileError?.message || 'Perfil no encontrado');
        }
        
        setCurrentUserRole(profile.role);
        
        // Redirigir si no es admin
        if (profile.role !== 'admin') {
          navigate('/unauthorized');
          return;
        }

        // Cargar usuarios si es admin
        await fetchAllUsers();
      } catch (err) {
        setError(err.message);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [navigate]);

  const fetchAllUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersData = profiles.map(profile => ({
        id: profile.id,
        email: profile.username || 'No disponible',
        created_at: profile.created_at,
        role: profile.role || 'cashier',
        username: profile.username
      }));

      setUsers(usersData);
    } catch (err) {
      setError(`Error al cargar usuarios: ${err.message}`);
      console.error('Error fetching users:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas despedir a este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
  
    try {
      if (currentUserRole !== 'admin') {
        throw new Error('No tienes permisos para realizar esta acción');
      }
  
      // Eliminar el perfil de la tabla 'profiles'
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
  
      if (error) {
        throw error;
      }
  
      // Actualizar la lista de usuarios
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err) {
      setError(`Error al despedir usuario: ${err.message}`);
      console.error('Error al despedir usuario:', err);
    }
  };
  

  const updateUserRole = async (userId, newRole) => {
    setError(null);
    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    
    try {
      if (currentUserRole !== 'admin') {
        throw new Error('No tienes permisos para realizar esta acción');
      }
  
      const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .maybeSingle(); // Usa maybeSingle en lugar de single
  
      if (error) {
        if (error.code === '42501') {
          throw new Error('No tienes permisos para modificar roles');
        }
        throw error;
      }
  
      if (!updatedUser) {
        throw new Error('El usuario no existe o no se pudo actualizar');
      }
  
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: updatedUser.role } : user
        )
      );
      
    } catch (err) {
      setError(`Error al actualizar: ${err.message}`);
      console.error("Error detallado:", err);
      await fetchAllUsers();
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: theme === 'light' ? 'black' : 'white',
        backgroundColor: theme === 'light' ? 'white' : '#121212'
      }}>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      color: theme === 'light' ? 'black' : 'white',
      backgroundColor: theme === 'light' ? 'white' : '#121212',
      minHeight: '100vh'
    }}>
      {/* Encabezado con botones */}
      <div style={{
        background: theme === 'light' ? '#333' : '#222',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button 
  onClick={() => navigate(-1)} // Redirige a la página anterior
  style={{
    background: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Regresar
</button>
        <h1>Panel de Administración</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={toggleTheme}
            style={{
              background: '#555',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </button>
          <button 
            onClick={handleLogout}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Botones principales */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '20px'
      }}>
        <button 
  onClick={() => navigate('/almacen')} // Redirige a la página de Almacén
  style={{
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Gestión de Almacén
</button>
<button 
  onClick={() => navigate('/PanelVentas')} // Redirige a la página anterior
  style={{
    background: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Venta
</button>
<button 
  onClick={() => navigate('/Historial')} // Redirige a la página anterior
  style={{
    background: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  historial de ventas
</button>
      </div>

      {/* Contenido principal */}
      <div style={{ 
        padding: '20px', 
        maxWidth: '1000px', 
        margin: '0 auto',
        color: theme === 'light' ? 'black' : 'white'
      }}>
        {error && (
          <div style={{
            padding: '10px',
            background: '#ffeeee',
            color: '#ff4444',
            marginBottom: '20px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff4444',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{
          background: theme === 'light' ? 'white' : '#1e1e1e',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Gestión de Usuarios ({users.length})</h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              color: theme === 'light' ? 'black' : 'white'
            }}>
              <thead>
                <tr style={{ background: theme === 'light' ? '#f5f5f5' : '#2d2d2d' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email/Usuario</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fecha Registro</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rol Actual</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: user.role === 'admin' ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.85em'
                      }}>
                        {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    <button
      onClick={() => updateUserRole(user.id, 'admin')}
      disabled={user.role === 'admin' || currentUserRole !== 'admin' || updatingRoles[user.id]}
      style={{
        padding: '6px 12px',
        background: user.role === 'admin' ? '#cccccc' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: user.role === 'admin' || currentUserRole !== 'admin' ? 'not-allowed' : 'pointer',
        opacity: updatingRoles[user.id] ? 0.7 : 1
      }}
    >
      {updatingRoles[user.id] ? 'Procesando...' : 'Hacer Admin'}
    </button>

    <button
      onClick={() => updateUserRole(user.id, 'cashier')}
      disabled={user.role === 'cashier' || currentUserRole !== 'admin' || updatingRoles[user.id]}
      style={{
        padding: '6px 12px',
        background: user.role === 'cashier' ? '#cccccc' : '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: user.role === 'cashier' || currentUserRole !== 'admin' ? 'not-allowed' : 'pointer',
        opacity: updatingRoles[user.id] ? 0.7 : 1
      }}
    >
      {updatingRoles[user.id] ? 'Procesando...' : 'Hacer Cajero'}
    </button>

    <button
      onClick={() => handleDeleteUser(user.id)}
      disabled={currentUserRole !== 'admin'}
      style={{
        padding: '6px 12px',
        background: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: currentUserRole !== 'admin' ? 'not-allowed' : 'pointer',
      }}
    >
      Despedir
    </button>
  </div>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
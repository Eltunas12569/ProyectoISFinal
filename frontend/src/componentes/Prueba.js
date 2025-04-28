import { useState, useEffect } from 'react';
import { supabase } from '../configuracion/supabase';

export default function AdminRoleManager() {
  // Estados del componente
  const [userId, setUserId] = useState('');
  const [newRole, setNewRole] = useState('cashier');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  // Obtener usuario actual al cargar
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .single();
            
          setCurrentUser(profile);
          
          // Si es admin, cargar lista de usuarios
          if (profile?.role === 'admin') {
            fetchUsers();
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Obtener lista de usuarios (solo para admins)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      setMessage({ text: `Error al cargar usuarios: ${error.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar roles
  const changeUserRole = async () => {
    // Validaciones iniciales
    if (!currentUser || currentUser.role !== 'admin') {
      setMessage({ text: 'No tienes permisos para esta acción', isError: true });
      return;
    }

    if (!userId) {
      setMessage({ text: 'Selecciona un usuario', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Actualizando rol...', isError: false });

    try {
      // 1. Verificar que el usuario objetivo existe
      const { data: targetUser, error: fetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (fetchError || !targetUser) {
        throw new Error(fetchError?.message || 'Usuario no encontrado');
      }

      // 2. Actualizar el rol
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Verificar el cambio
      const { data: updatedUser, error: verifyError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (verifyError || !updatedUser || updatedUser.role !== newRole) {
        throw new Error('No se pudo confirmar el cambio');
      }

      // Actualizar lista y mostrar éxito
      await fetchUsers();
      setMessage({ text: `Rol actualizado a ${newRole} correctamente`, isError: false });
    } catch (error) {
      console.error('Error changing role:', error);
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Si no es admin, mostrar mensaje
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div style={styles.unauthorizedContainer}>
        <h3 style={styles.unauthorizedTitle}>Acceso no autorizado</h3>
        <p>Esta función está disponible solo para administradores</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Gestión de Roles de Usuario</h2>
      <p style={styles.subtitle}>Solo para administradores</p>

      <div style={styles.formContainer}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Usuario:</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.select}
            disabled={loading || users.length === 0}
          >
            <option value="">Seleccionar usuario</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Nuevo rol:</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="cashier">Cajero</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
          </select>
        </div>

        <button
          onClick={changeUserRole}
          disabled={loading || !userId}
          style={{
            ...styles.button,
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            cursor: loading || !userId ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Procesando...' : 'Actualizar Rol'}
        </button>

        {message.text && (
          <div style={{
            ...styles.message,
            backgroundColor: message.isError ? '#ffebee' : '#e8f5e9',
            color: message.isError ? '#c62828' : '#2e7d32',
            borderLeft: `5px solid ${message.isError ? '#c62828' : '#2e7d32'}`
          }}>
            {message.text}
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div style={styles.userList}>
          <h3 style={styles.userListTitle}>Usuarios registrados</h3>
          <ul style={styles.userListItems}>
            {users.map(user => (
              <li key={user.id} style={styles.userListItem}>
                <span>{user.username}</span>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: getRoleColor(user.role)
                }}>
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares
const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#4CAF50';
    case 'manager': return '#2196F3';
    default: return '#607D8B';
  }
};

// Estilos del componente
const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  unauthorizedContainer: {
    maxWidth: '500px',
    margin: '20px auto',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    color: '#c62828'
  },
  unauthorizedTitle: {
    color: '#c62828',
    marginTop: '0'
  },
  title: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: '5px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    marginTop: '0',
    marginBottom: '30px',
    fontStyle: 'italic'
  },
  formContainer: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333333'
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #cccccc',
    backgroundColor: '#ffffff',
    fontSize: '16px'
  },
  button: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  message: {
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
    fontWeight: '500'
  },
  userList: {
    marginTop: '20px'
  },
  userListTitle: {
    borderBottom: '2px solid #eeeeee',
    paddingBottom: '10px',
    color: '#333333'
  },
  userListItems: {
    listStyle: 'none',
    padding: '0',
    margin: '0'
  },
  userListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    borderBottom: '1px solid #eeeeee'
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.8em',
    fontWeight: 'bold'
  }
};
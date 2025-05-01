import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../configuracion/supabase';

/**
 * Componente para proteger rutas basado en autenticación y roles
 * @param {object} props - Propiedades del componente
 * @param {ReactNode} props.children - Componentes hijos a renderizar si se cumple la autenticación
 * @param {string} [props.roleRequired] - Rol requerido para acceder a la ruta (opcional)
 * @param {boolean} [props.isAuthPage=false] - Si es true, redirige a dashboard si el usuario ya está autenticado
 * @returns {ReactNode} Componente protegido o redirección
 */
export default function ProtectedRoute({ children, roleRequired, isAuthPage = false }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Verificar sesión con Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        // 2. Si es página de autenticación y usuario logueado, redirigir
        if (isAuthPage && authUser) {
          const role = await getUserRole(authUser.id);
          return redirectByRole(role);
        }

        // 3. Si no es página de autenticación y no hay usuario, redirigir a login
        if (!isAuthPage && !authUser) {
          return navigate('/login');
        }

        // 4. Si hay usuario, obtener su rol
        if (authUser) {
          const role = await getUserRole(authUser.id);
          setUser({ ...authUser, role });

          // 5. Verificar si tiene el rol requerido
          if (roleRequired && role !== roleRequired) {
            return navigate('/unauthorized');
          }
        }

      } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        if (!isAuthPage) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, roleRequired, isAuthPage]);

  /**
   * Obtiene el rol del usuario desde Supabase
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} Rol del usuario
   */
  const getUserRole = async (userId) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error obteniendo rol:', error);
      throw new Error('No se pudo obtener el rol del usuario');
    }

    return profile.role;
  };

  /**
   * Redirige al usuario según su rol
   * @param {string} role - Rol del usuario
   */
  const redirectByRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'cashier':
        navigate('/cashier');
        break;
      default:
        navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando verificación de seguridad...</div>
      </div>
    );
  }

  // Si es página de autenticación y no hay usuario, mostrar children
  if (isAuthPage && !user) {
    return children;
  }

  // Si no es página de autenticación y hay usuario con los permisos correctos, mostrar children
  if (!isAuthPage && user) {
    return children;
  }

  // Por defecto, no renderizar nada (ya se manejaron las redirecciones)
  return null;
}
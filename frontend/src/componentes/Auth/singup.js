import { useState, createContext, useContext, useEffect } from 'react';
import { supabase } from '../../configuracion/supabase';

// 1. Crear el contexto del tema
const ThemeContext = createContext();

// 2. Proveedor del tema que envolverá la aplicación
function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Intentar obtener la preferencia guardada en localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true' ? true : false;
    }
    return false;
  });

  // Efecto para aplicar el tema al cargar y cuando cambia
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Crear elemento style para las variables CSS
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-variables';
    styleElement.textContent = `
      :root {
        --bg-color: ${darkMode ? '#121212' : '#ffffff'};
        --text-color: ${darkMode ? '#f0f0f0' : '#333333'};
        --input-bg: ${darkMode ? '#1e1e1e' : '#ffffff'};
        --input-border: ${darkMode ? '#444' : '#ddd'};
        --primary-btn: ${darkMode ? '#6a11cb' : '#007bff'};
        --error-bg: ${darkMode ? '#d32f2f' : '#ff4444'};
        --success-bg: ${darkMode ? '#388e3c' : '#00C851'};
      }
      
      body {
        background-color: var(--bg-color);
        color: var(--text-color);
        transition: background-color 0.3s ease, color 0.3s ease;
      }
    `;
    
    // Eliminar el estilo anterior si existe
    const existingStyle = document.getElementById('theme-variables');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    
    document.head.appendChild(styleElement);
    
    // Guardar preferencia
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Hook personalizado para usar el tema
function useTheme() {
  return useContext(ThemeContext);
}

// 4. Componente SignUp modificado
function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  // Estilos dinámicos usando variables CSS
  const styles = {
    formContainer: {
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)'
    },
    input: {
      padding: '10px',
      fontSize: '16px',
      borderRadius: '4px',
      border: '1px solid var(--input-border)',
      backgroundColor: 'var(--input-bg)',
      color: 'var(--text-color)'
    },
    button: {
      padding: '12px',
      backgroundColor: 'var(--primary-btn)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer'
    },
    error: {
      backgroundColor: 'var(--error-bg)',
      color: 'white'
    },
    success: {
      backgroundColor: 'var(--success-bg)',
      color: 'white'
    },
    themeToggle: {
      padding: '8px 12px',
      backgroundColor: darkMode ? 'var(--text-color)' : '#333',
      color: darkMode ? 'var(--bg-color)' : '#f0f0f0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '10px'
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
  
    try {
      // Paso 1: Registrar el usuario en Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
  
      if (authError) throw authError;
  
      // Paso 2: Crear el perfil en la tabla profiles con rol 'cashier'
      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,  // Asegurar que el email se guarde
            username: email,
            created_at: new Date().toISOString(),
            role: 'cashier'  // Cambiado de 'user' a 'cashier'
          }, {
            onConflict: 'id'
          });
  
        if (profileError) throw profileError;
      }
  
      setSuccess(true);
      alert('Registro exitoso! Por favor revisa tu correo para confirmar.');
    } catch (err) {
      setError(err.message);
      console.error('Error durante el registro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Registrarse</h2>
        <button 
          onClick={toggleDarkMode}
          style={styles.themeToggle}
          aria-label={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      
      {error && (
        <p style={{ 
          ...styles.error,
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          {error}
        </p>
      )}
      
      {success && (
        <p style={{ 
          ...styles.success,
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          ¡Registro exitoso! Por favor revisa tu correo para confirmar tu cuenta.
        </p>
      )}

      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={styles.input}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...styles.button,
            backgroundColor: loading ? '#6c757d' : 'var(--primary-btn)',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Procesando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

// 5. Componente App que envuelve todo
export default function App() {
  return (
    <ThemeProvider>
      <SignUp />
    </ThemeProvider>
  );
}
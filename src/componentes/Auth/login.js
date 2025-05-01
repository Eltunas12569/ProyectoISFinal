import { useState } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role === 'admin') {
        navigate('/AdminDashboard');
      } else if (profile.role === 'cashier') {
        navigate('/CashierDashboard');
      } else {
        setError('Rol no reconocido');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}></div>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              id="form2Example1"
              style={styles.input}
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              type="password"
              id="form2Example2"
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={styles.register}>
          <p>¿No tienes una cuenta? <span style={styles.link} onClick={() => navigate('/signup')}>Regístrate</span></p>
        </div>
      
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundImage: 'url("https://media.istockphoto.com/id/1438530555/es/foto/charcuter%C3%ADa-vac%C3%ADa-conceptos-de-peque%C3%B1as-empresas.jpg?s=612x612&w=0&k=20&c=k1VJoRcsvoPb3g5rAVoA61peaG1DL_BbxLsFu221T4o=")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    zIndex: 1,
  },
  title: {
    marginBottom: '20px',
    fontSize: '24px',
    color: '#333',
  },
  error: {
    color: '#d32f2f',
    marginBottom: '15px',
    backgroundColor: 'rgba(255, 235, 238, 0.7)',
    padding: '10px',
    borderRadius: '4px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  register: {
    marginTop: '15px',
    color: '#333',
  },
  link: {
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  social: {
    marginTop: '20px',
    color: '#333',
  },
  socialButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#333',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.3s',
  },
};
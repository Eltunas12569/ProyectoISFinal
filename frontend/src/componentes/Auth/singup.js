import { useState } from 'react';
import { supabase } from '../../configuracion/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Registrar usuario en Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email // Usamos el email como username
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      // 2. Crear perfil manualmente como respaldo
      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: email,
            created_at: new Date().toISOString(),
            role: 'user'
          }, {
            onConflict: 'id' // Si ya existe, actualiza
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // No lanzamos error para no interrumpir el flujo
        }
      }

      setSuccess(true);
      alert('Registro exitoso! Por favor revisa tu correo para confirmar.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar perfil (opcional)
  const checkProfileExists = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) console.error('Error checking profile:', error);
    return !!data;
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Registrarse</h2>
      
      {error && (
        <p style={{ 
          color: 'white', 
          backgroundColor: '#ff4444',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          {error}
        </p>
      )}
      
      {success && (
        <p style={{ 
          color: 'white', 
          backgroundColor: '#00C851',
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
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Procesando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}
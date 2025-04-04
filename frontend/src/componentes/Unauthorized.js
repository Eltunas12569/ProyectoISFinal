import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ color: '#dc3545' }}>Acceso No Autorizado</h1>
      <p>No tienes permisos para acceder a esta página.</p>
      <p>
        <Link to="/" style={{ 
          padding: '0.5rem 1rem', 
          background: '#007bff', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Volver al Inicio
        </Link>
      </p>
    </div>
  );
}
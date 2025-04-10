import React, { useEffect, useState } from 'react';
import { supabase } from '../configuracion/supabase';

export default function Prueba() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: products, error } = await supabase
          .from('products') // Asegúrate de que el nombre de la tabla sea correcto
          .select('*');

        if (error) {
          setError('Error al obtener datos');
          console.error('Error al obtener datos:', error);
        } else {
          setData(products);
        }
      } catch (err) {
        setError('Error inesperado');
        console.error('Error inesperado:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Componente de Prueba</h1>
      <p style={styles.text}>Este es un componente de prueba para verificar la funcionalidad de las rutas.</p>
      <ul style={{ listStyleType: "none" }}>
      {error && <p style={styles.error}>{error}</p>}
        {data.map((item) => (
          <li key={item.id} style={styles.listItem}>
            {item.name} 
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '20px',
  },
  text: {
    fontSize: '1.2rem',
    color: '#555',
    marginBottom: '20px',
  },
  error: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
  },
  listItem: {
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
  },
};
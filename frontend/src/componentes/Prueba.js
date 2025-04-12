import React, { useEffect, useState } from 'react';
import { supabase } from '../configuracion/supabase';
import styles from './Dashboard/csss/Pruebas.module.css';

export default function Prueba() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*');

        if (error) {
          setError('Error al obtener datos');
          console.error('Error al obtener datos:', error);
        } else {
          setData(products);
          setFilteredData(products);
        }
      } catch (err) {
        setError('Error inesperado');
        console.error('Error inesperado:', err);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => 
        item.name.toLowerCase().includes(term)
      );
      setFilteredData(filtered);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={styles.container} data-theme={theme}>
      {/* Barra superior negra */}
      <div className={styles.topBar}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Panel de Ventas</h1>
            <p className={styles.text}>Busque productos por nombre</p>
          </div>
          <button 
            onClick={toggleTheme}
            className={styles.themeToggle}
          >
            {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className={styles.mainContent}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <div className={styles.productsGrid}>
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div key={item.id} className={styles.productCard}>
                <h3>{item.name}</h3>
                <p>Precio: ${item.price}</p>
                <p>Stock: {item.stock}</p>
                <button className={styles.buyButton}>Agregar al carrito</button>
              </div>
            ))
          ) : (
            <p className={styles.noResults}>No se encontraron productos</p>
          )}
        </div>
      </div>
    </div>
  );
}
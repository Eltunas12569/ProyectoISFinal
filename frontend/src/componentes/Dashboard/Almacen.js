import { useEffect, useState } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function InventoryManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [theme, setTheme] = useState('light');
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: ''
  });
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // Función para alternar entre temas
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const checkPermissionsAndFetch = async () => {
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
        
        // Solo admin y inventory manager pueden acceder
        if (!['admin', 'inventory_manager'].includes(profile.role)) {
          navigate('/unauthorized');
          return;
        }

        // Cargar productos
        await fetchProducts();
      } catch (err) {
        setError(err.message);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkPermissionsAndFetch();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      setError(`Error al cargar productos: ${err.message}`);
      console.error('Error fetching products:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (updatingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', updatingProduct.id);

        if (error) throw error;
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchProducts();
      resetForm();
    } catch (err) {
      setError(`Error al ${updatingProduct ? 'actualizar' : 'crear'} producto: ${err.message}`);
      console.error('Error saving product:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: ''
    });
    setUpdatingProduct(null);
    setShowForm(false);
  };

  const editProduct = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
    setUpdatingProduct(product);
    setShowForm(true);
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await fetchProducts();
    } catch (err) {
      setError(`Error al eliminar producto: ${err.message}`);
      console.error('Error deleting product:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
        <p>Cargando gestión de almacén...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      color: theme === 'light' ? 'black' : 'white',
      backgroundColor: theme === 'light' ? 'white' : '#121212',
      minHeight: '100vh',
      paddingBottom: '50px'
    }}>
      {/* Encabezado */}
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
        <h1>Gestión de Almacén</h1>
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

      {/* Contenido principal */}
      <div style={{ 
        padding: '20px', 
        maxWidth: '1200px', 
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

        {/* Botón para agregar nuevo producto */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showForm ? 'Cancelar' : '➕ Agregar Producto'}
          </button>
        </div>

        {/* Formulario de producto */}
        {showForm && (
          <div style={{
            background: theme === 'light' ? '#f5f5f5' : '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2>{updatingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Descripción:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Precio:</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Stock:</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Categoría:</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {updatingProduct ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de productos */}
        <div style={{
          background: theme === 'light' ? 'white' : '#1e1e1e',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Inventario ({products.length})</h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              color: theme === 'light' ? 'black' : 'white'
            }}>
              <thead>
                <tr style={{ background: theme === 'light' ? '#f5f5f5' : '#2d2d2d' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Descripción</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Precio</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{product.name}</td>
                    <td style={{ padding: '12px' }}>{product.description || '-'}</td>
                    <td style={{ padding: '12px' }}>${product.price.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: product.stock < 10 ? 'red' : 'inherit' }}>
                      {product.stock}
                      {product.stock < 10 && ' (Bajo stock)'}
                    </td>
                    <td style={{ padding: '12px' }}>{product.category || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => editProduct(product)}
                          disabled={!['admin', 'inventory_manager'].includes(currentUserRole)}
                          style={{
                            padding: '6px 12px',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: ['admin', 'inventory_manager'].includes(currentUserRole) ? 'pointer' : 'not-allowed',
                            opacity: ['admin', 'inventory_manager'].includes(currentUserRole) ? 1 : 0.6
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={currentUserRole !== 'admin'}
                          style={{
                            padding: '6px 12px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: currentUserRole === 'admin' ? 'pointer' : 'not-allowed',
                            opacity: currentUserRole === 'admin' ? 1 : 0.6
                          }}
                        >
                          Eliminar
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
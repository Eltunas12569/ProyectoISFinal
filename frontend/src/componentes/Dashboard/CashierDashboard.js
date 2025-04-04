import { useEffect, useState } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function CashierDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!authUser) return navigate('/login');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) throw profileError;

        setUser({ ...authUser, ...profile });

        // Obtener solo 5 productos con stock disponible
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, stock')
          .gt('stock', 0)
          .order('stock', { ascending: false })
          .limit(5); // Limitar a 5 productos

        if (productsError) throw productsError;

        setProducts(productsData);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError(`No hay suficiente stock de ${product.name}`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem && (existingItem.quantity + 1) > product.stock) {
        setError(`No hay suficiente stock de ${product.name}`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      
      if (existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        return prevCart.filter(item => item.id !== productId);
      }
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    try {
      const updates = cart.map(item => 
        supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          total: calculateTotal(),
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        });

      if (saleError) throw saleError;

      setCart([]);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .gt('stock', 0)
        .order('name', { ascending: true })
        .limit(5); // Volver a limitar a 5 productos al actualizar
      
      setProducts(productsData);
      alert('Venta procesada con éxito!');

    } catch (err) {
      setError(`Error al procesar la venta: ${err.message}`);
      console.error('Error procesando venta:', err);
    }
  };

  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>Cargando panel de cajero...</div>;
  }

  return (
    <div>
      {/* Barra superior */}
      <div style={{
        background: '#333',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>Panel de Cajero</h1>
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

      {/* Contenido principal */}
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {error && (
          <div style={{
            padding: '10px',
            background: '#ffeeee',
            color: '#ff4444',
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            Error: {error}
            <button 
              onClick={() => setError(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                color: '#ff4444',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Información del usuario */}
        {user && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginBottom: '15px' }}>Información del Cajero</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <h3 style={{ marginBottom: '5px', color: '#666' }}>Rol</h3>
                <p style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  background: '#2196F3',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.85em'
                }}>
                  Cajero
                </p>
              </div>
              <div>
                <h3 style={{ marginBottom: '5px', color: '#666' }}>Correo</h3>
                <p style={{ fontSize: '18px' }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sección de productos (mostrará máximo 5) */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Productos Disponibles (Mostrando 5)</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {products.map(product => (
              <div 
                key={product.id}
                style={{
                  padding: '15px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <h4 style={{ margin: '0 0 5px 0' }}>{product.name}</h4>
                <p style={{ margin: '0 0 5px 0' }}>Precio: ${product.price.toFixed(2)}</p>
                <p style={{ margin: '0 0 10px 0' }}>Stock: {product.stock}</p>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: product.stock > 0 ? '#4CAF50' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                </button>
              </div>
            ))}
          </div>

          {/* Carrito de compras */}
          <div style={{
            background: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Carrito de Compras</h3>
            
            {cart.length === 0 ? (
              <p style={{ color: '#666' }}>No hay productos en el carrito</p>
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  {cart.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <div>
                        <p style={{ margin: 0 }}>{item.name}</p>
                        <small style={{ color: '#666' }}>
                          ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                        </small>
                      </div>
                      <div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            marginLeft: '10px',
                            padding: '5px 10px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '15px'
                }}>
                  <h4 style={{ margin: 0 }}>Total: ${calculateTotal().toFixed(2)}</h4>
                  <button 
                    onClick={processSale}
                    style={{
                      padding: '10px 20px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Procesar Venta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
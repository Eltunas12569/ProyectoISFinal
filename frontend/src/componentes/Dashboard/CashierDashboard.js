import { useEffect, useState } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function CashierDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const navigate = useNavigate();

  // Función para alternar entre temas
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

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
        await fetchProducts();
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, stock')
          .gt('stock', 0)
          .order('stock', { ascending: false })
          .limit(5);

        if (productsError) throw productsError;

        setProducts(productsData);
      } catch (err) {
        setError(err.message);
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

    setIsProcessing(true);
    
    try {
      // Verificar stock primero
      const stockCheck = await Promise.all(
        cart.map(item => 
          supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single()
        )
      );
      
      const stockErrors = stockCheck
        .map(({ data }, index) => ({ 
          item: cart[index], 
          available: data.stock 
        }))
        .filter(({ item, available }) => available < item.quantity);
      
      if (stockErrors.length > 0) {
        throw new Error(
          stockErrors.map(err => 
            `${err.item.name}: Disponible ${err.available}, Solicitado ${err.item.quantity}`
          ).join('\n')
        );
      }
      
      // Crear ticket
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          seller_id: user.id,
          total_amount: calculateTotal()
        }])
        .select();
      
      if (ticketError) throw ticketError;

      // Insertar items del ticket
      const { error: itemsError } = await supabase
        .from('ticket_items')
        .insert(
          cart.map(item => ({
            ticket_id: newTicket[0].id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price
          }))
        );
      
      if (itemsError) throw itemsError;

      // Actualizar stock
      await Promise.all(
        cart.map(item => 
          supabase
            .from('products')
            .update({ stock: item.stock - item.quantity })
            .eq('id', item.id)
        )
      );

      // Obtener ticket completo para mostrar
      const { data: completeTicket } = await supabase
        .from('tickets')
        .select(`
          id,
          sale_date,
          total_amount,
          seller_id,
          profiles:profiles (
            username,
            full_name
          ),
          ticket_items (
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', newTicket[0].id)
        .single();
      
      // Calcular subtotal para el ticket mostrado
      const ticketWithSubtotal = {
        ...completeTicket,
        ticket_items: completeTicket.ticket_items.map(item => ({
          ...item,
          subtotal: item.unit_price * item.quantity
        }))
      };
      
      setTicket(ticketWithSubtotal);
      setCart([]);
      setShowTicketModal(true);

      // Actualizar lista de productos
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .gt('stock', 0)
        .order('stock', { ascending: false })
        .limit(5);
      
      setProducts(productsData);
      
    } catch (err) {
      setError(`Error al procesar la venta: ${err.message}`);
      console.error('Error procesando venta:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: theme === 'light' ? 'black' : 'white',
      backgroundColor: theme === 'light' ? 'white' : '#121212'
    }}>Cargando panel de cajero...</div>;
  }

  return (
    <div style={{ 
      color: theme === 'light' ? 'black' : 'white',
      backgroundColor: theme === 'light' ? 'white' : '#121212',
      minHeight: '100vh'
    }}>
      {/* Barra superior */}
      <div style={{
        background: theme === 'light' ? '#333' : '#222',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>Panel de Cajero</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/PanelVentas')}
            style={{
              background: '#007BFF',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ventas
          </button>
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
        maxWidth: '1000px', 
        margin: '0 auto',
        color: theme === 'light' ? 'black' : 'white'
      }}>
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
            background: theme === 'light' ? 'white' : '#1e1e1e',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginBottom: '15px' }}>Información del Cajero</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <h3 style={{ marginBottom: '5px', color: theme === 'light' ? '#666' : '#aaa' }}>Rol</h3>
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
                <h3 style={{ marginBottom: '5px', color: theme === 'light' ? '#666' : '#aaa' }}>Correo</h3>
                <p style={{ fontSize: '18px' }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sección de productos */}
        <div style={{
          background: theme === 'light' ? 'white' : '#1e1e1e',
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
                  background: theme === 'light' ? '#f5f5f5' : '#2d2d2d',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#444'}`,
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
            background: theme === 'light' ? '#f9f9f9' : '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            border: `1px solid ${theme === 'light' ? '#eee' : '#444'}`
          }}>
            <h3 style={{ marginBottom: '15px' }}>Carrito de Compras</h3>
            
            {cart.length === 0 ? (
              <p style={{ color: theme === 'light' ? '#666' : '#aaa' }}>No hay productos en el carrito</p>
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
                        borderBottom: `1px solid ${theme === 'light' ? '#eee' : '#444'}`
                      }}
                    >
                      <div>
                        <p style={{ margin: 0 }}>{item.name}</p>
                        <small style={{ color: theme === 'light' ? '#666' : '#aaa' }}>
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
                    disabled={isProcessing}
                    style={{
                      padding: '10px 20px',
                      background: isProcessing ? '#cccccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessing ? 'Procesando...' : 'Procesar Venta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de ticket */}
      {showTicketModal && ticket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme === 'light' ? 'white' : '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '15px', textAlign: 'center' }}>Ticket de Venta</h2>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '5px 0' }}><strong>Número:</strong> #{ticket.id.slice(0, 8)}</p>
              <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {formatDate(ticket.sale_date)}</p>
              <p style={{ margin: '5px 0' }}><strong>Cajero:</strong> {ticket.profiles?.full_name || ticket.profiles?.username || 'Desconocido'}</p>
            </div>
            
            <div style={{ 
              borderTop: '1px dashed #ccc',
              borderBottom: '1px dashed #ccc',
              padding: '15px 0',
              margin: '15px 0'
            }}>
              {ticket.ticket_items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div>
                    <p style={{ margin: 0 }}>{item.product_name}</p>
                    <small style={{ color: theme === 'light' ? '#666' : '#aaa' }}>
                      {item.quantity} × ${item.unit_price.toFixed(2)}
                    </small>
                  </div>
                  <p style={{ margin: 0 }}>${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '1.1em',
              marginBottom: '20px'
            }}>
              <span>Total:</span>
              <span>${ticket.total_amount.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => setShowTicketModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#007BFF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
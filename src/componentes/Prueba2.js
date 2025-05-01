import React, { useEffect, useState } from 'react';
import { supabase } from '../configuracion/supabase';
import styles from './Dashboard/csss/Pruebas.module.css';

export default function Prueba() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCart, setShowCart] = useState(true);
  const [showTickets, setShowTickets] = useState(false);
  const [ticketsList, setTicketsList] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Obtener productos al cargar el componente
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

  // Función para obtener el historial de tickets
  const fetchTickets = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuario no autenticado');
  
      const { data: tickets, error } = await supabase
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
        .eq('seller_id', user.id)
        .order('sale_date', { ascending: false });
  
      if (error) throw error;
  
      // Calcular el subtotal en el cliente
      const ticketsWithSubtotal = tickets.map(ticket => ({
        ...ticket,
        ticket_items: ticket.ticket_items.map(item => ({
          ...item,
          subtotal: item.unit_price * item.quantity
        }))
      }));
  
      // Limitar a un máximo de 10 tickets
      setTicketsList(ticketsWithSubtotal.slice(0, 10) || []);
      setShowTickets(!showTickets);
    } catch (err) {
      console.error('Error al obtener tickets:', err);
      alert(`Error al obtener tickets: ${err.message}`);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredData(term === '' ? data : data.filter(item => item.name.toLowerCase().includes(term)));
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleCart = () => setShowCart(!showCart);
  const toggleTickets = () => setShowTickets(!showTickets);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('No hay suficiente stock disponible');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock < 1) {
        alert('No hay suficiente stock disponible');
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setShowCart(true);
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.id !== productId));

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const product = data.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`No puedes agregar más de ${product.stock} unidades de este producto`);
      return;
    }

    setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const processPurchase = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'Debes iniciar sesión');

      // Verificar stock
      const stockErrors = [];
      for (const item of cart) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();
        
        if (error) throw error;
        if (product.stock < item.quantity) {
          stockErrors.push({...item, available: product.stock});
        }
      }
      
      if (stockErrors.length > 0) {
        throw new Error(stockErrors.map(err => 
          `- ${err.name}: Disponible ${err.available}, Solicitado ${err.quantity}`
        ).join('\n'));
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
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*');
      
      setData(updatedProducts);
      setFilteredData(updatedProducts);
      
    } catch (err) {
      console.error('Error al procesar la compra:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className={styles.container} data-theme={theme}>
      <div className={styles.topBar}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Panel de Ventas</h1>
            <p className={styles.text}>Busque productos por nombre</p>
          </div>
          <div className={styles.headerButtons}>
            <button 
              onClick={fetchTickets}
              className={styles.ticketsButton}
            >
              {showTickets ? '📋 Ocultar Historial' : '📋 Ver Historial'}
            </button>
            <button 
              onClick={toggleTheme}
              className={styles.themeToggle}
            >
              {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        {/* Contenedor del carrito */}
        <div className={styles.cartContainer}>
          <div className={styles.cartHeader} onClick={toggleCart}>
            <h2>
              🛒 Carrito ({cart.length})
              <span className={styles.cartToggleIcon}>
                {showCart ? '▲' : '▼'}
              </span>
            </h2>
          </div>
          
          {showCart && (
            <div className={styles.cartContent}>
              {cart.length === 0 ? (
                <p className={styles.emptyCart}>El carrito está vacío</p>
              ) : (
                <>
                  <div className={styles.cartItemsContainer}>
                    {cart.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemDetails}>
                          <h4>{item.name}</h4>
                          <p>${item.price.toFixed(2)} c/u</p>
                          <div className={styles.quantityControls}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity - 1);
                              }}
                              className={styles.quantityButton}
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity + 1);
                              }}
                              className={styles.quantityButton}
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className={styles.cartItemSubtotal}>
                          <p>${(item.price * item.quantity).toFixed(2)}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.id);
                            }}
                            className={styles.removeButton}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.cartFooter}>
                    <div className={styles.cartTotal}>
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        processPurchase();
                      }}
                      className={styles.processButton}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : 'Finalizar Compra'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Contenedor de tickets (historial) */}
        {showTickets && (
          <div className={styles.ticketsContainer}>
            <div className={styles.ticketsHeader} onClick={toggleTickets}>
              <h2>
                📋 Historial de Ventas
                <span className={styles.ticketsToggleIcon}>
                  {showTickets ? '▲' : '▼'}
                </span>
              </h2>
            </div>
            
            <div className={styles.ticketsContent}>
              {ticketsList.length === 0 ? (
                <p className={styles.emptyTickets}>No hay tickets registrados</p>
              ) : (
                <div className={styles.ticketsListContainer}>
                  {ticketsList.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={styles.ticketListItem}
                      onClick={() => {
                        setTicket(ticket);
                        setShowTicketModal(true);
                      }}
                    >
                      <div className={styles.ticketListHeader}>
                        <span>Ticket #{ticket.id.slice(0, 8)}</span>
                        <span>{formatDate(ticket.sale_date)}</span>
                      </div>
                      <div className={styles.ticketListSeller}>
                        <span>Vendedor:</span>
                        <span>{ticket.profiles?.full_name || ticket.profiles?.username || 'Desconocido'}</span>
                      </div>
                      <div className={styles.ticketListTotal}>
                        <span>Total:</span>
                        <span>${ticket.total_amount.toFixed(2)}</span>
                      </div>
                      <div className={styles.ticketListItems}>
                        {ticket.ticket_items.slice(0, 2).map((item, index) => (
                          <div key={index} className={styles.ticketListProduct}>
                            <span>{item.quantity}x {item.product_name}</span>
                            <span>${item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                        {ticket.ticket_items.length > 2 && (
                          <div className={styles.ticketListMore}>
                            +{ticket.ticket_items.length - 2} más...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barra de búsqueda y productos */}
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
                <div className={styles.productInfo}>
                  <h3>{item.name}</h3>
                  <p>Precio: ${item.price.toFixed(2)}</p>
                  <p>Stock: {item.stock}</p>
                  <button 
                    onClick={() => addToCart(item)}
                    className={styles.buyButton}
                    disabled={item.stock < 1}
                  >
                    {item.stock < 1 ? 'Sin stock' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noResults}>No se encontraron productos</p>
          )}
        </div>
        
        {/* Modal de ticket de compra */}
        {showTicketModal && ticket && (
          <div className={styles.ticketModalOverlay}>
            <div className={styles.ticketModal}>
              <div className={styles.ticketContainer}>
                <div className={styles.ticketContent}>
                  <h2>Ticket de Compra</h2>
                  <p className={styles.ticketDate}>Fecha: {formatDate(ticket.sale_date)}</p>
                  <p className={styles.ticketId}>Número: #{ticket.id.slice(0, 8)}</p>
                  <p className={styles.ticketSeller}>
                    Vendedor: {ticket.profiles?.full_name || ticket.profiles?.username || 'Desconocido'}
                  </p>
                  
                  <div className={styles.ticketItemsHeader}>
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Total</span>
                  </div>
                  
                  <div className={styles.ticketItems}>
                    {ticket.ticket_items.map((item, index) => (
                      <div key={index} className={styles.ticketItem}>
                        <span>{item.product_name}</span>
                        <span>{item.quantity} x ${item.unit_price.toFixed(2)}</span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.ticketTotal}>
                    <span>Total:</span>
                    <span>${ticket.total_amount.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={() => setShowTicketModal(false)}
                    className={styles.closeTicketButton}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../../configuracion/supabase';
import { useNavigate } from 'react-router-dom';

export default function Historial() {
  const [ticketsList, setTicketsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchTickets = async () => {
    setLoading(true);
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
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const ticketsWithSubtotal = tickets.map(ticket => ({
        ...ticket,
        ticket_items: ticket.ticket_items.map(item => ({
          ...item,
          subtotal: item.unit_price * item.quantity
        }))
      }));

      setTicketsList(ticketsWithSubtotal || []);
    } catch (err) {
      console.error('Error al obtener tickets:', err);
      setError(`Error al obtener tickets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = ticketsList.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.id.toLowerCase().includes(searchLower) ||
      (ticket.profiles?.full_name?.toLowerCase().includes(searchLower) || 
       ticket.profiles?.username?.toLowerCase().includes(searchLower)) ||
      ticket.ticket_items.some(item => 
        item.product_name.toLowerCase().includes(searchLower)
    ));
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const handleTicketClick = (ticket) => {
    const selected = [ticket];
    setSelectedTickets(selected);
    setShowTicketModal(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'black',
        backgroundColor: 'white'
      }}>
        <p>Cargando historial de ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <p>{error}</p>
        <button onClick={fetchTickets} style={{
          background: '#007BFF',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      color: 'black',
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      {/* Barra Superior */}
      <div style={{
        background: '#333',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => navigate(-1)}
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
        <h1>📋 Historial de Ventas</h1>
        <div style={{ width: '100px' }}></div> {/* Para mantener el espacio */}
      </div>

      {/* Área de Búsqueda */}
      <div style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text"
            placeholder="Buscar en tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                color: '#888',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '20px' }}>
        {filteredTickets.length === 0 ? (
          <p style={{ textAlign: 'center' }}>
            {searchTerm ? 'No se encontraron tickets' : 'No hay tickets registrados'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => handleTicketClick(ticket)}
                style={{
                  border: '1px solid #ccc',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>Ticket #{ticket.id.slice(0, 8)}</strong> - {formatDate(ticket.sale_date)}
                </div>
                <div><strong>Vendedor:</strong> {ticket.profiles?.full_name || ticket.profiles?.username || 'Desconocido'}</div>
                <div><strong>Total:</strong> ${ticket.total_amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showTicketModal && selectedTickets.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>Detalles del Ticket</h2>
            {selectedTickets.map((ticket) => (
              <div key={ticket.id}>
                <p><strong>Fecha:</strong> {formatDate(ticket.sale_date)}</p>
                <p><strong>Vendedor:</strong> {ticket.profiles?.full_name || ticket.profiles?.username || 'Desconocido'}</p>

                {ticket.ticket_items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <span>{item.quantity} x {item.product_name}</span> - <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <hr />
                <p><strong>Total:</strong> ${ticket.total_amount.toFixed(2)}</p>
              </div>
            ))}
            <button 
              onClick={() => {
                setShowTicketModal(false);
              }}
              style={{
                marginTop: '16px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
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

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/Auth/login';
import SignUp from './componentes/Auth/singup';
import AdminDashboard from './componentes/Dashboard/AdminDashboard';
import CashierDashboard from './componentes/Dashboard/CashierDashboard';
import ProtectedRoute from './componentes/Auth/protectetroute';
import Unauthorized from './componentes/Unauthorized';
import Prueba from './componentes/Prueba'; // Importa el componente Prueba
import Almacen from './componentes/Dashboard/Almacen';
import PanelVentas from './componentes/Dashboard/PanelVentas';
import Hitory from './componentes/Dashboard/Historial'; // Corrige la ruta del componente Historial
import Prueba2 from './componentes/Prueba2'; // Importa el componente Prueba2
import './App.css';

function App() {

  return (
    <Router>
      <Routes>
        {/* Redirige la ruta raíz (/) al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/Historial" element={<Hitory />} />
        <Route path="/almacen" element={<Almacen />} />
        <Route path="/panelVentas" element={<PanelVentas />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route path="/AdminDashboard" element={
          <ProtectedRoute roleRequired="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/CashierDashboard" element={
          <ProtectedRoute roleRequired="cashier">
            <CashierDashboard />
          </ProtectedRoute>
        } />

        {/* Nueva ruta para el componente Prueba */}
        <Route path="/prueba" element={<Prueba />} />

        {/* Nueva ruta para el componente Prueba2 */}
        <Route path="/prueba2" element={<Prueba2 />} />
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/Auth/login';
import SignUp from './componentes/Auth/singup';
import AdminDashboard from './componentes/Dashboard/AdminDashboard';
import CashierDashboard from './componentes/Dashboard/CashierDashboard';
import ProtectedRoute from './componentes/Auth/protectetroute';
import Unauthorized from './componentes/Unauthorized';
import Prueba from './componentes/Prueba'; // Importa el componente Prueba
import PanelVentas from './componentes/Dashboard/PanelVentas';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirige la ruta raíz (/) al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
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
      </Routes>
    </Router>
  );
}

export default App;
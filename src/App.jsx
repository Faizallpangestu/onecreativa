import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import AccessRights from "./pages/AccessRights";
import AssignRFID from "./pages/AssignRFID";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Overtime from "./pages/Overtime";
import Leaves from "./pages/Leaves";
import DinasLuarKota from "./pages/DinasLuarKota";
import Settings from "./pages/Settings";
import Positions from "./pages/Positions";
import FaceEnrollment from "./pages/FaceEnrollment";
import FaceClock from "./pages/FaceClock";
import LocationSettings from "./pages/LocationSettings";
import Profit from "./pages/Profit";
import Reimbursement from "./pages/Reimbursement";
import PayrollHRD from "./pages/PayrollHRD";
import SlipGajiKaryawan from "./pages/SlipGajiKaryawan";

import MenuKaryawan from "./pages/MenuKaryawan";
import MenuHRD from "./pages/MenuHRD";
import MenuAdmin from "./pages/MenuAdmin";
import MenuFinance from "./pages/MenuFinance";
import MenuGA from "./pages/MenuGA";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Navigate to="/home" />} />
        <Route path="/login"           element={<Login />} />
        
        {/* Public / Selector Route */}
        <Route path="/home"            element={<Home />} />
        
        {/* Protected Routes */}
        <Route path="/menu-karyawan"   element={<ProtectedRoute><MenuKaryawan /></ProtectedRoute>} />
        <Route path="/menu-hrd"        element={<ProtectedRoute><MenuHRD /></ProtectedRoute>} />
        <Route path="/menu-admin"      element={<ProtectedRoute><MenuAdmin /></ProtectedRoute>} />
        <Route path="/menu-finance"    element={<ProtectedRoute><MenuFinance /></ProtectedRoute>} />
        <Route path="/menu-ga"         element={<ProtectedRoute><MenuGA /></ProtectedRoute>} />
        
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/employees"       element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/access-rights"   element={<ProtectedRoute><AccessRights /></ProtectedRoute>} />
        <Route path="/assign-rfid"     element={<ProtectedRoute><AssignRFID /></ProtectedRoute>} />
        <Route path="/attendance"      element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/payroll"         element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
        <Route path="/payroll-hrd"     element={<ProtectedRoute><PayrollHRD /></ProtectedRoute>} />
        <Route path="/overtime"        element={<ProtectedRoute><Overtime /></ProtectedRoute>} />
        <Route path="/leaves"          element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
        <Route path="/dinas"           element={<ProtectedRoute><DinasLuarKota /></ProtectedRoute>} />
        <Route path="/slip-gaji-karyawan" element={<ProtectedRoute><SlipGajiKaryawan /></ProtectedRoute>} />
        <Route path="/reimbursement"   element={<ProtectedRoute><Reimbursement /></ProtectedRoute>} />
        <Route path="/profit"          element={<ProtectedRoute><Profit /></ProtectedRoute>} />
        <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/positions"       element={<ProtectedRoute><Positions /></ProtectedRoute>} />
        <Route path="/face-enrollment" element={<ProtectedRoute><FaceEnrollment /></ProtectedRoute>} />
        <Route path="/face-clock"      element={<ProtectedRoute><FaceClock /></ProtectedRoute>} />
        <Route path="/location-settings" element={<ProtectedRoute><LocationSettings /></ProtectedRoute>} />
        <Route path="/profit"          element={<ProtectedRoute><Profit /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

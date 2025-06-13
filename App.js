
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./Login";
import Signup from './Signup';
import AdminDashboard from "./AdminDashboard";
import DriverDashboard from "./DriverDashboard";
import BookSlot from "./BookSlot";
import MyBookings from "./MyBookings";
import MyPayments from "./MyPayments";
import AdminSlots from './AdminSlots';
import AdminBookings from './AdminBookings';
import AdminPayments from "./AdminPayments";
import AdminPenalties from "./AdminPenalties";
import Membership from './Membership';
import MyPenalties from './MyPenalties';
import AdminUsers from './AdminUsers';

// Wrapper to pass userId from location.state to MyPenalties
function MyPenaltiesWrapper() {
  const location = useLocation();
  const userId = location.state?.userId;
  return <MyPenalties userId={userId} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/book-slot" element={<BookSlot />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-payments" element={<MyPayments />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/my-penalties" element={<MyPenaltiesWrapper />} />

        {/* Admin-only routes */}
        <Route path="/admin/slots" element={<AdminSlots />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/penalties" element={<AdminPenalties />} />
        
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
    </Router>
  );
}

export default App;
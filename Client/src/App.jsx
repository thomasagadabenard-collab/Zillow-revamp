
import { useState } from "react";
import { Routes, Route, Navigate, Outlet, useOutletContext } from "react-router-dom";

import Navbar from "./Components/Common/Navbar.jsx";
import GuestLayout from "./Components/Layouts/GuestLayout.jsx";
import SignupModal from "./Components/Common/SignupModal.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import { useAuth } from "./Context/Authcontext.jsx";
import AdminDashboard from "./Components/Common/AdminDashboard.jsx";
import Transactions from "./Pages/Transactions.jsx";
import Buy from "./Pages/Buy.jsx";
import Agents from "./Pages/Agents.jsx";
import Mortgage from "./Pages/Mortgage.jsx";
import ListProperty from "./Pages/ListProperty.jsx";
import BrowseProperties from "./Pages/BrowseProperties.jsx";
import SavedProperties from "./Pages/SavedProperties.jsx";
import Settings from "./Pages/Settings.jsx";
import ResetPassword from "./Pages/ResetPassword.jsx";

function PublicLayout({ onSignIn }) {
  return (
    <>
      <Navbar onSignIn={onSignIn} />
      <Outlet context={{ openSignIn: onSignIn }} />
    </>
  );
}

function HomePage() {
  const { openSignIn } = useOutletContext();
  return <GuestLayout onSignIn={openSignIn} />;
}

export default function App() {
  const { login } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  return (
    <>
      <Routes>
        <Route element={<PublicLayout onSignIn={openAuth} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/buy" element={<Buy onSignIn={openAuth} />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/mortgage" element={<Mortgage />} />
          <Route path="/list-property" element={<ListProperty />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard onSignIn={openAuth} />} />
        <Route path="/dashboard/properties" element={<BrowseProperties onSignIn={openAuth} />} />
        <Route path="/dashboard/saved" element={<SavedProperties onSignIn={openAuth} />} />
        <Route path="/dashboard/transactions" element={<Transactions onSignIn={openAuth} />} />
        <Route path="/dashboard/settings" element={<Settings onSignIn={openAuth} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SignupModal
        isOpen={isAuthOpen}
        onClose={closeAuth}
        onAuthenticated={(user) => { login(user); closeAuth(); }}
      />
    </>
  );
}

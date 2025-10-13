// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleGate from "./auth/RoleGate";
import AppShell from "./layouts/AppShell";

import Login from "./pages/common_pages/Login";
import Register from "./pages/common_pages/Register";
import Dashboard from "./pages/Dashboard";
import BackofficeDashboard from "./pages/BackofficeDashboard";
import Unauthorized from "./pages/Unauthorized";
import MyProfile from "./pages/common_pages/MyProfile_web";
import UsersList from "./pages/users/UsersList";

// Owners
import OwnersList from "./pages/owners/OwnersList";
import OwnerUpsert from "./pages/owners/OwnerUpsert";

// Stations
import StationsList from "./pages/stations/StationsList";
import StationUpsert from "./pages/stations/StationUpsert";
import StationSchedule from "./pages/stations/StationSchedule";

// Bookings
import BookingsList from "./pages/bookings/BookingsList";

// Operator
import OperatorApprovals from "./pages/operator/OperatorApprovals";
import OperatorScan from "./pages/operator/operatorScan";
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import StationDetails from "./pages/operator/StationDetails";
import OperatorBookings from "./pages/operator/OperatorBookings";

const router = createBrowserRouter([
  // Public (no navbar)
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          // Smart forwarder after login
          { path: "/dashboard", element: <Dashboard /> },

          // Backoffice-only
          {
            element: <RoleGate allowed={["Backoffice"]} />,
            children: [
              { path: "/backoffice", element: <BackofficeDashboard /> },
              { path: "/users", element: <UsersList />},
              { path: "/register", element: <Register /> },

              // EV Owners
              { path: "/owners", element: <OwnersList /> },
              { path: "/owners/new", element: <OwnerUpsert /> },
              { path: "/owners/:nic", element: <OwnerUpsert /> },

              // Stations
              { path: "/stations", element: <StationsList /> },
              { path: "/stations/new", element: <StationUpsert /> },
              { path: "/stations/:id", element: <StationUpsert /> },
              { path: "/stations/:id/schedule", element: <StationSchedule /> },
              { path: "/bookings", element: <BookingsList /> },
            ],
          },

          // Operator-only
          {
            element: <RoleGate allowed={["Operator"]} />,
            children: [
              { path: "/operator", element: <OperatorDashboard /> },
              { path: "/operator/approvals", element: <OperatorApprovals /> },
              { path: "/operator/scan", element: <OperatorScan /> },

              // Stations (list + schedule)
              { path: "/stationDetails", element: <StationDetails /> },
              { path: "/stations/:id/schedule", element: <StationSchedule /> },
              { path: "/operator/bookings", element: <OperatorBookings /> },
            ],
          },

          // Shared (Backoffice & Operator)
          {
            element: <RoleGate allowed={["Backoffice", "Operator"]} />,
            children: [
              { path: "/me/profile", element: <MyProfile /> },
            ],
          },

          // Unauthorized (show navbar too)
          { path: "/unauthorized", element: <Unauthorized /> },
        ],
      },
    ],
  },

  // Fallback
  { path: "*", element: <Login /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

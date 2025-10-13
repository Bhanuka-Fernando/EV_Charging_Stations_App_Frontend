import { Outlet } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";

export default function AppShell() {
    return (
        <div className="min-h-screen bg-gray-50">
            <AppNavbar />
            <main className="msx-w-7xl mx-auto px-6 py-8">
                <Outlet />
            </main> 
        </div>
    );
}
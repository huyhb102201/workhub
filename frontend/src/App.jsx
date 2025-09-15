import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";

function Home() {
  return <main className="p-8"><h1 className="text-3xl font-bold">Trang chủ</h1></main>;
}

// Layout có Navbar
function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Routes dùng layout có Navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" />
      </Route>

      {/* Route không có Navbar */}
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

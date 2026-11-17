import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import InspectionsPage from "./components/inspections/InspectionsPage.jsx";
import RecallsPage from "./components/recalls/RecallsPage.jsx";
import AuthProvider from "./components/auth/AuthProvider.jsx";
import AuthDialog from "./components/auth/AuthDialog.jsx";
import About from "./components/About.jsx";
import GroceryListPage from "./components/grocery/GroceryListPage.jsx";
import "./App.css";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="site-shell">
          <a className="site-shell__skip-link" href="#main-content">
            Skip to content
          </a>

          <Navbar />

          <div className="site-shell__content" id="main-content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recalls" element={<RecallsPage />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/restaurants"
                element={
                  <main>
                    <InspectionsPage />
                  </main>
                }
              />
              <Route path="/grocery-list" element={<GroceryListPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        <AuthDialog />
      </AuthProvider>
    </BrowserRouter>
  );
}

App.propTypes = {};

export default App;

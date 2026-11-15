import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import InspectionsPage from "./components/inspections/InspectionsPage.jsx";
import RecallsPage from "./components/recalls/RecallsPage.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="site-shell">
        <a className="site-shell__skip-link" href="#main-content">
          Skip to content
        </a>

        <Navbar />

        <div className="site-shell__content" id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recalls" element={<RecallsPage />} />
            <Route
              path="/restaurants"
              element={
                <main>
                  <InspectionsPage />
                </main>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

App.propTypes = {};

export default App;

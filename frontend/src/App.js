import "@/App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteProvider } from "@/context/SiteContext";
import { captureAttribution } from "@/lib/attribution";
import ArchitectureReviewPage from "@/pages/ArchitectureReviewPage";
import CityPage from "@/pages/CityPage";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import TireMatchPage from "@/pages/TireMatchPage";

// Capture the landing URL, referrer and campaign parameters once, before any routing or redirect.
captureAttribution();

function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tire-match" element={<TireMatchPage />} />
          {/* Staging-only internal page; its API returns 404 in production. */}
          <Route path="/internal/architecture" element={<ArchitectureReviewPage />} />
          <Route path="/:citySlug" element={<CityPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SiteProvider>
    </BrowserRouter>
  );
}

export default App;

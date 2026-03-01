import { StrictMode, useContext, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./Context/UserContext.jsx";
import { LoadingProvider, LoadingContext } from "./Context/LoaderContext.jsx";
import { NotifProvider } from "./Context/NotifContext.jsx"
import { setupAxiosInterceptors } from "./Utils/api.js";
import SiteProvider from "./Context/SiteContext.jsx";

// Wrapper to setup Axios interceptors with context
const AppWithAxios = () => {
  const { setGlobalLoading, setComponentLoading } = useContext(LoadingContext);

  useEffect(() => {
    setupAxiosInterceptors(setGlobalLoading, setComponentLoading);
  }, [setGlobalLoading, setComponentLoading]);

  return <App />;
};

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <NotifProvider>
    <BrowserRouter>
      <UserProvider>
        <SiteProvider >
          <LoadingProvider>
            <AppWithAxios />
          </LoadingProvider>
        </SiteProvider>
      </UserProvider>
    </BrowserRouter>
  </NotifProvider>
  // </StrictMode>
);

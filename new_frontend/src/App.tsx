import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { DrawerProvider } from './contexts/DrawerContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';
import { FeatureFlagPanel } from './components/debug/FeatureFlagPanel';
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SessionProvider>
            <DrawerProvider>
              <AppProvider>
                <AppRoutes />
                {/* Feature Flag Debug Panel (development only) */}
                {import.meta.env.DEV && <FeatureFlagPanel />}
              </AppProvider>
            </DrawerProvider>
          </SessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

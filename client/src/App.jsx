import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import StoreInitializer from './components/StoreInitializer';
import Dashboard from './components/Dashboard';
import IDE from './components/IDE';
import AuthCallback from './components/AuthCallback';
import NotFound from './components/NotFound';
import './App.css';

function App() {
  return (
    <StoreInitializer>
      <AuthProvider>
        <ProjectProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/ide/:framework" element={<IDE />} />
                <Route path="/ide" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </ProjectProvider>
      </AuthProvider>
    </StoreInitializer>
  );
}

export default App;
import React from 'react';
import AppContent from './AppContent';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

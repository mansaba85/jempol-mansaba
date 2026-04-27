import React from 'react';
import AppContent from './AppContent';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

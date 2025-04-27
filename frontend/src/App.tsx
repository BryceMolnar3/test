import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DisplaySettingsProvider } from './contexts/DisplaySettingsContext.tsx';
import ManuscriptViewer from './pages/ManuscriptViewer.tsx';
import VerseId from './pages/verse/VerseId.tsx';
import NewDataEntry from './pages/NewDataEntry.tsx';
import SearchDatabase from './pages/SearchDatabase.tsx';
import ManualDifferentiation from './pages/ManualDifferentiation.tsx';
import Settings from './pages/Settings.tsx';
import PhylogeneticAnalysis from './pages/PhylogeneticAnalysis.tsx';

function App() {
  return (
    <DisplaySettingsProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/search-database" />} />
        <Route path="/manuscript-viewer/:sigla" element={<ManuscriptViewer />} />
        <Route path="/verse/:verseNumber" element={<VerseId />} />
        <Route path="/new-data-entry" element={<NewDataEntry />} />
        <Route path="/search-database" element={<SearchDatabase />} />
        <Route path="/manual-differentiation" element={<ManualDifferentiation />} />
        <Route path="/phylogenetic-analysis" element={<PhylogeneticAnalysis />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/search-database" />} />
      </Routes>
    </DisplaySettingsProvider>
  );
}

export default App; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Blog } from './pages/Blog';
import { ShareView } from './pages/ShareView';
import Test from './pages/Test';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          <Route path="/pricing" element={<Landing />} />
          <Route path="/privacy" element={<Landing />} />
          <Route path="/terms" element={<Landing />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

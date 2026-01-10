import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Blog } from './pages/Blog';
import { Resources } from './pages/Resources';
import { Community } from './pages/Community';
import { Admin } from './pages/Admin';
import { ResetPassword } from './pages/ResetPassword';
import { ShareView } from './pages/ShareView';
import { GroupView } from './pages/GroupView';
import Test from './pages/Test';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/community" element={<Community />} />
          <Route path="/pricing" element={<Landing />} />
          <Route path="/privacy" element={<Landing />} />
          <Route path="/terms" element={<Landing />} />
          <Route path="/test" element={<Test />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="/group/:inviteCode" element={<GroupView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

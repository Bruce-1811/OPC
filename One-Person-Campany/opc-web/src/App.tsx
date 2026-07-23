import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import AppLayout from './layouts/AppLayout';
import DiscoverPage from './pages/DiscoverPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectApplicationsPage from './pages/ProjectApplicationsPage';
import ProjectPage from './pages/ProjectPage';
import DraftsPage from './pages/DraftsPage';
import FavoritesPage from './pages/FavoritesPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PublishPage from './pages/PublishPage';
import MessagePage from './pages/MessagePage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/projects/:id/applications" element={<ProjectApplicationsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/project" element={<ProjectPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/publish/:projectId" element={<PublishPage />} />
          <Route path="/drafts" element={<DraftsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/applications" element={<MyApplicationsPage />} />
          <Route path="/message" element={<MessagePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

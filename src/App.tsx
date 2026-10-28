import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Calendars from './pages/Calendars';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Opportunities from './pages/Opportunities';
import Reputation from './pages/Reputation';
import Payments from './pages/Payments';
import Campaigns from './pages/Campaigns';
import Social from './pages/Social';
import Prospecting from './pages/Prospecting';
import MediaLibrary from './pages/MediaLibrary';
import Funnels from './pages/Funnels';
import Websites from './pages/Websites';
import Forms from './pages/Forms';
import Workflows from './pages/Workflows';
import Memberships from './pages/Memberships';
import Documents from './pages/Documents';
import Reporting from './pages/Reporting';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="calendars" element={<Calendars />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="reputation" element={<Reputation />} />
        <Route path="payments" element={<Payments />} />
        <Route path="documents" element={<Documents />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="social" element={<Social />} />
        <Route path="prospecting" element={<Prospecting />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="funnels" element={<Funnels />} />
        <Route path="websites" element={<Websites />} />
        <Route path="forms" element={<Forms />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="memberships" element={<Memberships />} />
        <Route path="reporting" element={<Reporting />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

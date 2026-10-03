import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Films from './pages/Films';
import Galleries from './pages/Galleries';
import Enquiry from './pages/Enquiry';
import About from './pages/About';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="stories" element={<Stories />} />
        <Route path="stories/:slug" element={<StoryDetail />} />
        <Route path="films" element={<Films />} />
        <Route path="galleries" element={<Galleries />} />
        <Route path="enquiry" element={<Enquiry />} />
        <Route path="about" element={<About />} />
        {/* Unknown paths fall back to Home, mirroring the live site's behaviour. */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

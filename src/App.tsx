import { useEffect, useState } from 'react';
import FinanceDashboard from './components/FinanceDashboard';
import LoginPage from './components/LoginPage';
import PublicOverview from './components/PublicOverview';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [path, setPath] = useState(window.location.pathname);
  const isLoginPage = path === '/login';

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  useEffect(() => {
    if (isLoggedIn && isLoginPage) {
      window.history.replaceState({}, '', '/');
      setPath('/');
    }

    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, isLoginPage]);

  if (isLoginPage && !isLoggedIn) {
    return <LoginPage onLogin={() => { setIsLoggedIn(true); navigate('/'); }} />;
  }

  if (!isLoggedIn) {
    return <PublicOverview onAdminLogin={() => navigate('/login')} />;
  }

  return <FinanceDashboard onLogout={() => setIsLoggedIn(false)} />;
}

export default App;
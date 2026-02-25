import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">AI Interviewer</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/create" className="text-surface-300 hover:text-white transition-colors">
              {t('nav.create')}
            </Link>
            <Link to="/pricing" className="text-surface-300 hover:text-white transition-colors">
              {t('nav.pricing')}
            </Link>
            
            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-surface-300 hover:text-white transition-colors">
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === i18n.language)?.flag || '🌐'}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-surface-900 border border-surface-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-4 py-2 text-left hover:bg-surface-800 transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
                      i18n.language === lang.code ? 'text-primary-400' : 'text-surface-300'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-surface-800 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-surface-300 text-sm">
          <p>© 2026 AI Interviewer by DenseMatrix Labs</p>
        </div>
      </footer>
    </div>
  );
}

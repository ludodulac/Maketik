import './globals.css';

export const metadata = { title: 'Maketik', description: 'Studio personnel de création de vidéos courtes' };

export default function RootLayout({ children }) {
  return <html lang="fr"><body>{children}</body></html>;
}

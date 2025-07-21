import './globals.css';
import Navbar from './components/navbar';

export const metadata = {
  title: 'Sola Hail Risk Report',
  description: 'Your risk, visualized and reimagined.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}


import './globals.css';

export const metadata = {
  title: 'Yojna-Setu | योजना-सेतु | Voice-First Government Scheme Assistant',
  description:
    'Discover Indian government welfare schemes you qualify for. Speak in Hindi, Kannada, Tamil, Telugu — AI matches you to PM-KISAN, Ayushman Bharat, and 20+ more schemes.',
  keywords: 'government schemes, India, welfare, PM-KISAN, Ayushman Bharat, voice assistant, Hindi, Tamil, Telugu, Kannada',
  openGraph: {
    title: 'Yojna-Setu - Your Voice. Your Language. Your Rights.',
    description: 'AI-powered voice assistant for discovering Indian government welfare schemes',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0E1A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

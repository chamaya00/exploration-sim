import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Beyond',
  description: 'Send explorers into a mysterious world and watch their journey unfold',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-xl font-bold text-gray-900">
                The Beyond
              </a>
              <div className="flex gap-4">
                <a
                  href="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </a>
                <a
                  href="/explorers"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Your Explorers
                </a>
                <a
                  href="/world"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  World
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

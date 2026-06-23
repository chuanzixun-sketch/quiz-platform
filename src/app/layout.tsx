import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: '智能动态题库平台',
  description: '智能动态题库平台 - 高效学习，智能刷题',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

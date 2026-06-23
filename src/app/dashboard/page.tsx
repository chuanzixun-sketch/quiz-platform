'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Library } from '@/types';
import { Library as LibraryIcon, BookOpen, TrendingUp, Target, Clock } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [stats, setStats] = useState({
    totalLibraries: 0,
    totalQuestions: 0,
    todayAttempts: 0,
    accuracy: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [libsRes, statsRes] = await Promise.all([
        apiFetch<Library[]>('/api/libraries?limit=6'),
        apiFetch<any>('/api/stats'),
      ]);

      if (libsRes.data) setLibraries(libsRes.data);
      if (statsRes.data) {
        setStats({
          totalLibraries: statsRes.data.totalLibraries || libsRes.data?.length || 0,
          totalQuestions: statsRes.data.stats?.total_attempts || 0,
          todayAttempts: statsRes.data.todayAttempts || 0,
          accuracy: statsRes.data.accuracy || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const statCards = [
    { icon: LibraryIcon, label: '题库数量', value: stats.totalLibraries, color: '#3b82f6', bg: '#eff6ff' },
    { icon: BookOpen, label: '题目总数', value: stats.totalQuestions, color: '#22c55e', bg: '#f0fdf4' },
    { icon: TrendingUp, label: '今日答题', value: stats.todayAttempts, color: '#f59e0b', bg: '#fffbeb' },
    { icon: Target, label: '正确率', value: `${stats.accuracy}%`, color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <p className="page-description">欢迎回来，{user?.email?.split('@')[0] || '用户'}！</p>
      </div>

      <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card stat-card">
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>最近题库</h2>
          <Link href="/libraries" className="btn btn-ghost btn-sm">查看全部</Link>
        </div>

        {libraries.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Clock size={48} />
              <h3>暂无题库</h3>
              <p>创建您的第一个题库，开始学习之旅</p>
              <Link href="/libraries" className="btn btn-primary" style={{ marginTop: '1rem' }}>创建题库</Link>
            </div>
          </div>
        ) : (
          <div className="grid-cards">
            {libraries.map((lib) => (
              <Link key={lib.id} href={`/libraries/${lib.id}`} style={{ textDecoration: 'none' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{lib.name}</h3>
                    <span className={`badge badge-${lib.visibility === 'public' ? 'success' : 'primary'}`}>
                      {lib.visibility === 'public' ? '公开' : lib.visibility === 'shared' ? '共享' : '私密'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {lib.description || '暂无描述'}
                  </p>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{lib.question_count} 道题目</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

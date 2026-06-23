'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { StudySession, Library } from '@/types';
import { BarChart3, TrendingUp, Target, Clock, BookOpen, Calendar } from 'lucide-react';

export default function StatsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sessRes, libsRes] = await Promise.all([
        apiFetch<StudySession[]>('/api/study-sessions'),
        apiFetch<Library[]>('/api/libraries'),
      ]);
      if (sessRes.data) setSessions(sessRes.data);
      if (libsRes.data) setLibraries(libsRes.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  const totalAnswered = sessions.reduce((sum, s) => sum + s.questions_answered, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_count, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const now = new Date();
  const filteredSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    return timeRange === 'week' ? diffDays <= 7 : diffDays <= 30;
  });

  const periodAnswered = filteredSessions.reduce((sum, s) => sum + s.questions_answered, 0);
  const periodCorrect = filteredSessions.reduce((sum, s) => sum + s.correct_count, 0);
  const periodAccuracy = periodAnswered > 0 ? Math.round((periodCorrect / periodAnswered) * 100) : 0;

  const dailyStats: Record<string, { answered: number; correct: number }> = {};
  filteredSessions.forEach((s) => {
    const dateKey = s.date.split('T')[0];
    if (!dailyStats[dateKey]) dailyStats[dateKey] = { answered: 0, correct: 0 };
    dailyStats[dateKey].answered += s.questions_answered;
    dailyStats[dateKey].correct += s.correct_count;
  });

  const sortedDates = Object.entries(dailyStats).sort(([a], [b]) => a.localeCompare(b));
  const maxAnswered = Math.max(...Object.values(dailyStats).map((d) => d.answered), 1);

  const statCards = [
    { icon: BarChart3, label: '总答题数', value: totalAnswered, color: '#3b82f6', bg: '#eff6ff' },
    { icon: Target, label: '总正确率', value: `${overallAccuracy}%`, color: '#22c55e', bg: '#f0fdf4' },
    { icon: Clock, label: '学习时长', value: `${totalDuration}分钟`, color: '#f59e0b', bg: '#fffbeb' },
    { icon: BookOpen, label: '题库数量', value: libraries.length, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学习统计</h1>
        <p className="page-description">追踪您的学习进度和表现</p>
      </div>

      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card stat-card">
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}><Icon size={24} /></div>
              <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600 }}>学习趋势</h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTimeRange('week')}>本周</button>
            <button className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTimeRange('month')}>本月</button>
          </div>
        </div>
        {sortedDates.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}><BarChart3 size={36} /><h3>暂无数据</h3><p>开始刷题后，这里会显示学习趋势</p></div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '150px', padding: '0.5rem 0' }}>
              {sortedDates.map(([date, stats]) => (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '100%', height: `${(stats.answered / maxAnswered) * 100}%`, minHeight: '4px', background: stats.answered > 0 && (stats.correct / stats.answered) >= 0.8 ? 'var(--success)' : stats.answered > 0 && (stats.correct / stats.answered) >= 0.6 ? 'var(--warning)' : 'var(--danger)', borderRadius: '0.25rem 0.25rem 0 0', transition: 'height 0.3s', opacity: 0.8 }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--muted)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--muted)' }}>期间答题：<strong>{periodAnswered}</strong> 题</span>
              <span style={{ color: 'var(--muted)' }}>正确率：<strong style={{ color: periodAccuracy >= 80 ? 'var(--success)' : 'var(--warning)' }}>{periodAccuracy}%</strong></span>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>最近学习记录</h3>
        {sessions.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}><Calendar size={36} /><h3>暂无记录</h3><p>完成刷题后会自动记录学习数据</p></div>
        ) : (
          <div>
            {sessions.slice(0, 20).map((session) => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{new Date(session.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{session.duration_minutes > 0 ? `学习 ${session.duration_minutes} 分钟` : '快速练习'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{session.correct_count}/{session.questions_answered}</p>
                  <p style={{ fontSize: '0.75rem', color: session.questions_answered > 0 ? (session.correct_count / session.questions_answered) >= 0.8 ? 'var(--success)' : (session.correct_count / session.questions_answered) >= 0.6 ? 'var(--warning)' : 'var(--danger)' : 'var(--muted)' }}>
                    {session.questions_answered > 0 ? Math.round((session.correct_count / session.questions_answered) * 100) + '%' : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

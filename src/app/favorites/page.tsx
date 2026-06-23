'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Favorite, Question } from '@/types';
import { Star, Trash2, ExternalLink } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<(Favorite & { question?: Question })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: favs } = await apiFetch<any[]>('/api/favorites');
      if (favs && favs.length > 0) {
        const questionIds = favs.map((f: any) => f.question_id);
        const { data: questions } = await apiFetch<Question[]>(`/api/questions?ids=${questionIds.join(',')}`);
        const questionMap = new Map(questions?.map((q) => [q.id, q]));
        setFavorites(favs.map((f: any) => ({ ...f, question: questionMap.get(f.question_id) })));
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    await apiFetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">收藏夹</h1>
        <p className="page-description">共收藏了 {favorites.length} 道题目</p>
      </div>
      {favorites.length === 0 ? (
        <div className="card"><div className="empty-state"><Star size={48} /><h3>暂无收藏</h3><p>在刷题时点击星标按钮，收藏重要的题目</p><Link href="/libraries" className="btn btn-primary" style={{ marginTop: '1rem' }}>前往题库</Link></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {favorites.map((fav) => (
            <div key={fav.id} className="card" style={{ padding: '1.25rem' }}>
              {fav.question && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Star size={16} color="var(--warning)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span className="badge badge-warning">{fav.question.question_content.type === 'single' ? '单选题' : fav.question.question_content.type === 'multiple' ? '多选题' : fav.question.question_content.type === 'true_false' ? '判断题' : '题目'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>收藏于 {new Date(fav.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div onClick={() => setExpanded(expanded === fav.id ? null : fav.id)} style={{ cursor: 'pointer' }}>
                        <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{fav.question.question_content.question.substring(0, 120)}{fav.question.question_content.question.length > 120 ? '...' : ''}</p>
                      </div>
                      {expanded === fav.id && (
                        <div style={{ marginTop: '1rem' }}>
                          {fav.question.question_content.options && <div style={{ marginBottom: '0.75rem' }}>
                            {fav.question.question_content.options.map((opt, i) => <div key={i} style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}>{String.fromCharCode(65 + i)}. {opt}</div>)}
                          </div>}
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 600 }}>答案：</span><span style={{ color: 'var(--success)' }}>{Array.isArray(fav.question.answer) ? fav.question.answer.join(', ') : fav.question.answer}</span>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === fav.id ? null : fav.id)}>{expanded === fav.id ? '收起' : '查看详情'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveFavorite(fav.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /> 取消收藏</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

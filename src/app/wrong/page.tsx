'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { WrongQuestion, Question } from '@/types';
import { AlertCircle, BookOpen, Check, RotateCcw, ExternalLink } from 'lucide-react';

export default function WrongQuestionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wrongQuestions, setWrongQuestions] = useState<(WrongQuestion & { question?: Question })[]>([]);
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
      const { data: wrong } = await apiFetch<any[]>('/api/wrong-questions');
      if (wrong && wrong.length > 0) {
        const questionIds = wrong.map((w: any) => w.question_id);
        const { data: questions } = await apiFetch<Question[]>(`/api/questions?ids=${questionIds.join(',')}`);
        const questionMap = new Map(questions?.map((q) => [q.id, q]));
        const combined = wrong.map((w: any) => ({ ...w, question: questionMap.get(w.question_id) }));
        setWrongQuestions(combined);
      } else {
        setWrongQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching wrong questions:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleMarkMastered = async (id: string) => {
    await apiFetch('/api/wrong-questions', { method: 'PUT', body: { id, mastered: true } });
    setWrongQuestions((prev) => prev.map((w) => (w.id === id ? { ...w, mastered: true } : w)));
  };

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  const activeWrong = wrongQuestions.filter((w) => !w.mastered);
  const masteredWrong = wrongQuestions.filter((w) => w.mastered);

  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = { single: '单选题', multiple: '多选题', true_false: '判断题', fill_blank: '填空题', short_answer: '简答题' };
    return labels[t] || t;
  };

  const renderQuestion = (q: Question) => {
    const options = q.question_content.options || [];
    return (
      <div>
        <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{q.question_content.question}</p>
        {options.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {options.map((opt, i) => <div key={i} style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}>{String.fromCharCode(65 + i)}. {opt}</div>)}
        </div>}
        <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>正确答案：</span>
          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>{Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}</span>
        </div>
        {q.analysis && <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>解析：</span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem', lineHeight: 1.6 }}>{q.analysis}</p>
        </div>}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">错题本</h1>
        <p className="page-description">共 {activeWrong.length} 道错题待复习{masteredWrong.length > 0 && ` · ${masteredWrong.length} 道已掌握`}</p>
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="card"><div className="empty-state"><AlertCircle size={48} /><h3>暂无错题</h3><p>开始刷题后，做错的题目会自动收录到这里</p><Link href="/libraries" className="btn btn-primary" style={{ marginTop: '1rem' }}>前往题库</Link></div></div>
      ) : (
        <>
          {activeWrong.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>待复习错题</h2>
              {activeWrong.map((w) => (
                <div key={w.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertCircle size={16} color="var(--danger)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {w.question && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span className="badge badge-danger">错 {w.wrong_count} 次</span>
                          <span className="badge badge-primary">{getTypeLabel(w.question.question_content.type)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>上次做错：{new Date(w.last_wrong_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div onClick={() => setExpanded(expanded === w.id ? null : w.id)} style={{ cursor: 'pointer' }}>
                          <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{w.question.question_content.question.substring(0, 100)}{w.question.question_content.question.length > 100 ? '...' : ''}</p>
                        </div>
                        {expanded === w.id && <div style={{ marginTop: '1rem' }}>{renderQuestion(w.question)}</div>}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>{expanded === w.id ? '收起' : '查看详情'}</button>
                          <button className="btn btn-success btn-sm" onClick={() => handleMarkMastered(w.id)}><Check size={14} /> 标记已掌握</button>
                        </div>
                      </>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {masteredWrong.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>已掌握</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {masteredWrong.map((w) => (
                  <div key={w.id} className="card" style={{ padding: '1rem 1.25rem', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Check size={16} color="var(--success)" />
                      <p style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.question?.question_content.question || '题目已删除'}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>错 {w.wrong_count} 次</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

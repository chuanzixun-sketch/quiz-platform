'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Library, Question } from '@/types';
import { Play, Upload, Plus, ArrowLeft, Trash2 } from 'lucide-react';

export default function LibraryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const id = params?.id as string;
  const [library, setLibrary] = useState<Library | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qType, setQType] = useState<'single' | 'multiple' | 'true_false' | 'fill_blank' | 'short_answer'>('single');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '']);
  const [qAnswer, setQAnswer] = useState<string | string[]>('');
  const [qAnalysis, setQAnalysis] = useState('');
  const [qDifficulty, setQDifficulty] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) fetchData();
  }, [user, id]);

  const fetchData = async () => {
    try {
      const [libRes, qsRes] = await Promise.all([
        apiFetch<Library>(`/api/libraries?id=${id}`),
        apiFetch<Question[]>(`/api/libraries/${id}/questions`),
      ]);
      if (libRes.data) setLibrary(libRes.data);
      if (qsRes.data) setQuestions(qsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const text = q.question_content?.question || '';
    if (search && !text.toLowerCase().includes(search.toLowerCase())) return false;
    if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    setSaving(true);
    try {
      const questionContent: any = { type: qType, question: qText.trim() };
      if (qType === 'single' || qType === 'multiple') {
        questionContent.options = qOptions.filter((o) => o.trim());
      } else if (qType === 'true_false') {
        questionContent.options = ['正确', '错误'];
      }

      const { data, error } = await apiFetch<Question>(`/api/libraries/${id}/questions`, {
        method: 'POST',
        body: { question_content: questionContent, answer: qAnswer, analysis: qAnalysis, difficulty: qDifficulty },
      });
      if (error) return alert('添加失败: ' + error);
      if (data) {
        setQuestions([data, ...questions]);
        setShowQuestionForm(false);
        setQText('');
        setQOptions(['', '']);
        setQAnswer('');
        setQAnalysis('');
        setQDifficulty(3);
      }
    } catch (err: any) {
      alert('添加失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('确定要删除这道题目吗？')) return;
    try {
      await apiFetch(`/api/libraries/${id}/questions/${questionId}`, { method: 'DELETE' });
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  if (!library) {
    return (
      <div className="empty-state">
        <h3>题库不存在</h3>
        <Link href="/libraries" className="btn btn-primary" style={{ marginTop: '1rem' }}>返回题库列表</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Link href="/libraries" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
            <ArrowLeft size={18} /> 返回题库列表
          </Link>
          <h1 className="page-title">{library.name}</h1>
          <p className="page-description">{library.description || '暂无描述'} · {questions.length} 道题目</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`/libraries/${id}/import`} className="btn btn-secondary"><Upload size={18} /> 导入</Link>
          <Link href={`/libraries/${id}/quiz`} className="btn btn-primary"><Play size={18} /> 开始刷题</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <input type="text" placeholder="搜索题目..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((d) => (
                <button key={d} className={`btn ${difficultyFilter === d ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}>{d}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowQuestionForm(true)}><Plus size={18} /> 添加题目</button>
        </div>
      </div>

      {showQuestionForm && (
        <div className="modal-overlay" onClick={() => setShowQuestionForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>添加题目</h2>
            <form onSubmit={handleAddQuestion}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>题型</label>
                <select value={qType} onChange={(e) => setQType(e.target.value as any)}>
                  <option value="single">单选题</option>
                  <option value="multiple">多选题</option>
                  <option value="true_false">判断题</option>
                  <option value="fill_blank">填空题</option>
                  <option value="short_answer">简答题</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>题目内容</label>
                <textarea placeholder="输入题目..." value={qText} onChange={(e) => setQText(e.target.value)} rows={3} required />
              </div>
              {(qType === 'single' || qType === 'multiple') && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>选项</label>
                  {qOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, lineHeight: '2.25rem', minWidth: '1.5rem' }}>{String.fromCharCode(65 + i)}.</span>
                      <input type="text" value={opt} onChange={(e) => { const newOpts = [...qOptions]; newOpts[i] = e.target.value; setQOptions(newOpts); }} style={{ flex: 1 }} />
                      {qOptions.length > 2 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQOptions(qOptions.filter((_, j) => j !== i))}>×</button>}
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQOptions([...qOptions, ''])}>+ 添加选项</button>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>答案</label>
                <input type="text" value={Array.isArray(qAnswer) ? qAnswer.join('') : qAnswer} onChange={(e) => setQAnswer(qType === 'multiple' ? e.target.value.split('') : e.target.value)} placeholder="正确答案" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>解析（选填）</label>
                <textarea value={qAnalysis} onChange={(e) => setQAnalysis(e.target.value)} rows={3} placeholder="题目解析..." />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>难度</label>
                <select value={qDifficulty} onChange={(e) => setQDifficulty(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'⭐'.repeat(d)}{'☆'.repeat(5 - d)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredQuestions.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>暂无题目</h3><p>添加题目或导入 Excel/CSV 文件</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredQuestions.map((q, idx) => (
            <div key={q.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">
                      {q.question_content.type === 'single' ? '单选题' : q.question_content.type === 'multiple' ? '多选题' : q.question_content.type === 'true_false' ? '判断题' : '题目'}
                    </span>
                    <span className={`badge badge-${q.difficulty <= 2 ? 'success' : q.difficulty <= 3 ? 'warning' : 'danger'}`}>{'⭐'.repeat(q.difficulty)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{idx + 1}</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{q.question_content.question}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteQuestion(q.id)} style={{ color: 'var(--danger)', marginLeft: '1rem' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

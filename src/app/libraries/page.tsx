'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Library } from '@/types';
import { Plus, Library as LibraryIcon, Trash2, MoreHorizontal, Upload } from 'lucide-react';

export default function LibrariesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisibility, setNewVisibility] = useState<'private' | 'public' | 'shared'>('private');
  const [creating, setCreating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchLibraries();
  }, [user]);

  const fetchLibraries = async () => {
    try {
      const { data } = await apiFetch<Library[]>('/api/libraries');
      if (data) setLibraries(data);
    } catch (err) {
      console.error('Error fetching libraries:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await apiFetch<Library>('/api/libraries', {
        method: 'POST',
        body: { name: newName.trim(), description: newDescription.trim(), visibility: newVisibility },
      });
      if (error) throw new Error(error);
      if (data) {
        setLibraries([data, ...libraries]);
        setShowCreate(false);
        setNewName('');
        setNewDescription('');
      }
    } catch (err: any) {
      console.error('Error creating library:', err);
      alert('创建失败: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个题库吗？所有题目也将被删除。')) return;
    try {
      const { error } = await apiFetch(`/api/libraries/${id}`, { method: 'DELETE' });
      if (error) throw new Error(error);
      setLibraries(libraries.filter((l) => l.id !== id));
    } catch (err: any) {
      console.error('Error deleting library:', err);
      alert('删除失败: ' + err.message);
    }
  };

  if (loading || dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">我的题库</h1>
          <p className="page-description">管理和组织您的所有题库</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> 创建题库
        </button>
      </div>

      {libraries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <LibraryIcon size={48} />
            <h3>还没有题库</h3>
            <p>点击上方按钮创建您的第一个题库</p>
          </div>
        </div>
      ) : (
        <div className="grid-cards">
          {libraries.map((lib) => (
            <div key={lib.id} className="card" style={{ position: 'relative' }}>
              <div className="card-header">
                <Link href={`/libraries/${lib.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                  <h3 className="card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</h3>
                </Link>
                <div className="dropdown">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDropdownOpen(dropdownOpen === lib.id ? null : lib.id)}>
                    <MoreHorizontal size={16} />
                  </button>
                  {dropdownOpen === lib.id && (
                    <div className="dropdown-menu">
                      <Link href={`/libraries/${lib.id}/import`} className="dropdown-item" onClick={() => setDropdownOpen(null)}>
                        <Upload size={16} /> 导入题目
                      </Link>
                      <div className="dropdown-item danger" onClick={() => { setDropdownOpen(null); handleDelete(lib.id); }}>
                        <Trash2 size={16} /> 删除题库
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Link href={`/libraries/${lib.id}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                  {lib.description || '暂无描述'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${lib.visibility === 'public' ? 'success' : 'primary'}`}>
                    {lib.visibility === 'public' ? '公开' : lib.visibility === 'shared' ? '共享' : '私密'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{lib.question_count} 道题目</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>创建新题库</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>题库名称</label>
                <input type="text" placeholder="例如：高等数学、英语四级..." value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>描述（选填）</label>
                <textarea placeholder="题库的简要描述..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>可见性</label>
                <select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value as any)}>
                  <option value="private">私密 - 仅自己可见</option>
                  <option value="shared">共享 - 通过链接可见</option>
                  <option value="public">公开 - 所有人可见</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? '创建中...' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

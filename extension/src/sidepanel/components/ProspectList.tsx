import React, { useState, useEffect } from 'react';
import { getProspects, saveProspect, deleteProspect, SavedProspect } from '../../lib/storage';

export function ProspectList() {
  const [prospects, setProspects] = useState<SavedProspect[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    const data = await getProspects();
    setProspects(data);
  };

  const handleDelete = async (id: string) => {
    await deleteProspect(id);
    await loadProspects();
  };

  const handleStatusChange = async (prospect: SavedProspect, status: SavedProspect['status']) => {
    await saveProspect({ ...prospect, status });
    await loadProspects();
  };

  const allTags = Array.from(new Set(prospects.flatMap(p => p.tags)));

  const filtered = prospects.filter(p => {
    const matchesSearch = !searchQuery ||
      p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || p.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const statusColors: Record<string, string> = {
    new: 'bg-blue-900/30 text-blue-400',
    researched: 'bg-purple-900/30 text-purple-400',
    contacted: 'bg-yellow-900/30 text-yellow-400',
    'follow-up': 'bg-orange-900/30 text-orange-400',
    replied: 'bg-green-900/30 text-green-400',
    closed: 'bg-gray-900/30 text-gray-400',
  };

  return (
    <div className="space-y-3">
      {/* Search and filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search prospects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field text-sm flex-1"
        />
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="input-field text-sm w-28"
          >
            <option value="">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-pitch-text-muted">{filtered.length} prospect{filtered.length !== 1 ? 's' : ''}</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center text-pitch-text-muted text-sm py-8">
          {prospects.length === 0
            ? 'No saved prospects yet. Scan a website and save it.'
            : 'No prospects match your search.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(prospect => (
            <div key={prospect.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-pitch-text">{prospect.companyName}</h3>
                  <p className="text-xs text-pitch-text-muted">{prospect.domain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={prospect.status}
                    onChange={e => handleStatusChange(prospect, e.target.value as SavedProspect['status'])}
                    className={`text-[10px] rounded-full px-2 py-0.5 border-0 ${statusColors[prospect.status] || ''}`}
                  >
                    <option value="new">New</option>
                    <option value="researched">Researched</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={() => handleDelete(prospect.id)}
                    className="text-pitch-text-muted hover:text-red-400 text-xs"
                    title="Delete"
                  >
                    x
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {prospect.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-pitch-border px-1.5 py-0.5 rounded text-pitch-text-muted">
                    {tag}
                  </span>
                ))}
                <span className="text-[10px] text-pitch-text-muted">
                  {prospect.industry} | {prospect.estimatedSize}
                </span>
              </div>

              {prospect.notes && (
                <p className="text-xs text-pitch-text-muted mt-1.5 line-clamp-2">{prospect.notes}</p>
              )}

              <p className="text-[10px] text-pitch-text-muted mt-1.5">
                Saved {new Date(prospect.savedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

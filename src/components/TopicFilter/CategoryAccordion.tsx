import { useState } from 'react';
import { Category } from '../../types/topic';

interface Props {
  category: Category;
  selectedTopicIds: Set<string>;
  answeredByTopic: Record<string, number>;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
}

export function CategoryAccordion({ category, selectedTopicIds, answeredByTopic, onToggleTopic, onToggleCategory }: Props) {
  const [open, setOpen] = useState(false);
  const selectedCount = category.topics.filter(t => selectedTopicIds.has(t.id)).length;
  const allSelected = selectedCount === category.topics.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const categoryAnswered = category.topics.reduce((sum, t) => sum + (answeredByTopic[t.id] || 0), 0);
  const categoryTotal = category.topics.reduce((sum, t) => sum + t.questionCount, 0);
  const categoryRemaining = categoryTotal - categoryAnswered;

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-800 cursor-pointer hover:bg-slate-750 select-none"
        onClick={() => setOpen(!open)}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleCategory(category); }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            allSelected ? 'bg-teal-500 border-teal-500' :
            someSelected ? 'bg-teal-800 border-teal-600' :
            'border-slate-500'
          }`}
        >
          {allSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          {someSelected && <div className="w-2 h-0.5 bg-teal-400 rounded" />}
        </button>
        <span className="font-semibold text-slate-200 flex-1">{category.name}</span>
        {categoryAnswered > 0 && (
          <span className="text-xs text-slate-500">{categoryRemaining} left</span>
        )}
        <span className="text-sm text-slate-400">{selectedCount}/{category.topics.length}</span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="px-4 py-2 space-y-1 border-t border-slate-700" style={{ backgroundColor: '#1a2332' }}>
          {category.topics.map(topic => {
            const answered = answeredByTopic[topic.id] || 0;
            const remaining = topic.questionCount - answered;
            const allDone = remaining <= 0;
            const isHard = topic.id.endsWith('-hard');
            return (
              <label key={topic.id} className={`flex items-center gap-3 py-1.5 cursor-pointer hover:bg-slate-700 px-2 rounded ${allDone ? 'opacity-50' : ''} ${isHard ? 'border-l-2 border-amber-500/50 ml-1' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedTopicIds.has(topic.id)}
                  onChange={() => onToggleTopic(topic.id)}
                  className={`w-4 h-4 rounded border-slate-500 focus:ring-teal-500 bg-slate-700 ${isHard ? 'text-amber-500 focus:ring-amber-500' : 'text-teal-500'}`}
                />
                <span className={`text-sm flex-1 ${isHard ? 'text-amber-200' : 'text-slate-300'}`}>
                  {isHard && <span className="text-amber-500 mr-1">⚡</span>}
                  {topic.name}
                </span>
                {answered > 0 ? (
                  <span className={`text-xs ${allDone ? 'text-green-500' : 'text-slate-500'}`}>
                    {allDone ? 'done' : `${remaining} left`}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">{topic.questionCount}q</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

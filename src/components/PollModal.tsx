import React, { useState } from 'react';
import { BarChart2, X, Plus, Trash2, Send } from 'lucide-react';
import { PollData } from '../types';

interface PollModalProps {
  onSend: (poll: PollData) => void;
  onClose: () => void;
}

export const PollModal: React.FC<PollModalProps> = ({ onSend, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const filledOptions = options.filter(o => o.trim().length > 0);
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 non-empty options');
      return;
    }

    onSend({
      question: question.trim(),
      allowMultipleAnswers: allowMultiple,
      options: filledOptions.map((text, idx) => ({
        id: 'opt_' + idx + '_' + Date.now(),
        text: text.trim(),
        votes: []
      }))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">Create Poll</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Question</label>
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => { setQuestion(e.target.value); setError(''); }}
              autoFocus
              className="w-full bg-gray-50 text-[#1c1e21] px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
            />
          </div>

          {/* Options List */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Options</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 text-center text-xs font-mono font-bold text-gray-400 select-none">
                  {idx + 1}.
                </div>
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-gray-50 text-[#1c1e21] px-3.5 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:outline-none transition"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs text-[#0084ff] hover:text-[#0073e6] font-bold py-1 px-2 hover:bg-blue-50 rounded-lg transition mt-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add option</span>
              </button>
            )}
          </div>

          {/* Toggle Multiple Answers */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1c1e21]">Allow multiple answers</span>
            <button
              type="button"
              onClick={() => setAllowMultiple(!allowMultiple)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowMultiple ? 'bg-[#0084ff]' : 'bg-gray-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                allowMultiple ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
            >
              <span>Create Poll</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

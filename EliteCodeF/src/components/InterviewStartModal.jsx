import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { NeonButton } from './NeonButton';

const DIFFICULTIES = [
    { label: 'EASY', time: 60 * 60 },        // 1 hour
    { label: 'MEDIUM', time: 90 * 60 },  // 2 hours
    { label: 'HARD', time: 120 * 60 },    // 3 hours
];
const TOPICS = [
    'Arrays', 'Strings', 'Hash Tables', 'Dynamic Programming',
    'Graphs', 'Trees', 'Sorting', 'Searching', 'Recursion', 'Math',
];

export function InterviewStartModal({ isOpen, onClose, onStart }) {
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTIES[1]); // MEDIUM by default

    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleStart = () => {
        if (selectedTopics.length === 0) return;
        onStart(selectedTopics, selectedDifficulty.label, selectedDifficulty.time);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl glass-panel rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-magenta to-violet flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-txt-primary">Interview Setup</h2>
                            <p className="text-xs text-txt-muted">Customize your technical interview</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-txt-muted">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Difficulty */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-txt-muted mb-3">
                            Difficulty
                        </label>
                        <div className="flex gap-3">
                            {DIFFICULTIES.map(d => (
                                <button
                                    key={d.label}
                                    onClick={() => setSelectedDifficulty(d)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedDifficulty.label === d.label
                                            ? 'bg-cyan/10 border border-cyan/30 text-cyan shadow-glow-sm'
                                            : 'bg-white/[0.03] border border-white/5 text-txt-secondary hover:bg-white/[0.05]'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topics */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-txt-muted mb-3">
                            Topics (select at least one)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopic(topic)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        selectedTopics.includes(topic)
                                            ? 'bg-violet/20 border border-violet/30 text-violet'
                                            : 'bg-white/[0.03] border border-white/5 text-txt-secondary hover:bg-white/[0.05]'
                                    }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                        {selectedTopics.length === 0 && (
                            <p className="text-xs text-txt-muted mt-2">Choose at least one topic to focus the interview</p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <NeonButton variant="ghost" onClick={onClose}>Cancel</NeonButton>
                    <NeonButton
                        variant="solid"
                        onClick={handleStart}
                        disabled={selectedTopics.length === 0}
                    >
                        Start Interview
                    </NeonButton>
                </div>
            </div>
        </div>
    );
}

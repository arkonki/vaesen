import React, { useState, useEffect } from 'react';

interface CampaignJournalProps {
  content: string;
  onUpdate: (content: string) => void;
}

const CampaignJournal: React.FC<CampaignJournalProps> = ({ content, onUpdate }) => {
  const [text, setText] = useState(content);

  useEffect(() => {
    const handler = setTimeout(() => {
      onUpdate(text);
    }, 500); // Debounce saving

    return () => {
      clearTimeout(handler);
    };
  }, [text, onUpdate]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-stone-900/60 rounded-lg border border-stone-700 shadow-xl">
      <h2 className="font-cinzel text-3xl text-center mb-4">Campaign Journal</h2>
      <p className="text-center text-stone-400 mb-6">Record your findings, track clues, and chronicle your encounters with the supernatural. Your notes are saved automatically.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="The old innkeeper spoke of a strange light in the marsh..."
        className="w-full h-[60vh] bg-stone-800/70 p-4 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg leading-relaxed resize-none"
      />
    </div>
  );
};

export default CampaignJournal;

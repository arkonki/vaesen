import React, { useState, useMemo } from 'react';
import { Character, DefectInsight } from '../types';

interface EndMysteryModalProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onClose: () => void;
}

const XP_QUESTIONS = [
  "Did you participate in the session?",
  "Did you confront any vaesen?",
  "Did you identify a previously unknown vaesen?",
  "Were you affected by your Dark Secret?",
  "Did you take risks to protect other people?",
  "Have you learned anything? (what?)",
  "Did you develop something in your headquarters?",
  "Did you perform an extraordinary action?",
];

const EndMysteryModal: React.FC<EndMysteryModalProps> = ({ character, onCharacterUpdate, onClose }) => {
  const [step, setStep] = useState<'xp' | 'recovery'>('xp');
  const [xpAnswers, setXpAnswers] = useState<boolean[]>(Array(XP_QUESTIONS.length).fill(true));

  const [physRoll, setPhysRoll] = useState<{ result: number[], successes: number } | null>(null);
  const [mentalRoll, setMentalRoll] = useState<{ result: number[], successes: number } | null>(null);
  
  const [permanentDefects, setPermanentDefects] = useState<DefectInsight[]>([]);
  const [permanentInsights, setPermanentInsights] = useState<DefectInsight[]>([]);

  const [physSuccessesToSpend, setPhysSuccessesToSpend] = useState(0);
  const [mentalSuccessesToSpend, setMentalSuccessesToSpend] = useState(0);

  const handleXpCheck = (index: number) => {
    const newAnswers = [...xpAnswers];
    newAnswers[index] = !newAnswers[index];
    setXpAnswers(newAnswers);
  };
  
  const confirmXp = () => {
    const earnedXp = xpAnswers.filter(Boolean).length;
    onCharacterUpdate({...character, xp: character.xp + earnedXp});
    setPermanentDefects([...character.defects]);
    setPermanentInsights([...character.insights]);
    setStep('recovery');
  };

  const rollRecovery = (type: 'physical' | 'mental') => {
      let dicePool = 0;
      if (type === 'physical') {
          dicePool = character.attributes.Physique + character.attributes.Precision;
      } else {
          dicePool = character.attributes.Logic + character.attributes.Empathy;
      }
      const result = Array.from({ length: dicePool }, () => Math.ceil(Math.random() * 6));
      const successes = result.filter(r => r === 6).length;

      if (type === 'physical') {
        setPhysRoll({ result, successes });
        setPhysSuccessesToSpend(successes);
      } else {
        setMentalRoll({ result, successes });
        setMentalSuccessesToSpend(successes);
      }
  }

  const spendSuccess = (type: 'physical' | 'mental', action: 'heal' | 'keep', injury: DefectInsight) => {
    if (type === 'physical' && physSuccessesToSpend > 0) {
        if(action === 'heal') setPermanentDefects(prev => prev.filter(d => d.name !== injury.name));
        // Insights are kept by default if not removed, but we'll model it as "spending" to keep
        setPhysSuccessesToSpend(s => s - 1);
    } else if (type === 'mental' && mentalSuccessesToSpend > 0) {
        if(action === 'heal') setPermanentDefects(prev => prev.filter(d => d.name !== injury.name));
        setMentalSuccessesToSpend(s => s - 1);
    }
  };
  
  const finish = () => {
    // Insights not 'kept' with a success will fade
    const finalInsights = character.insights.filter(i => permanentInsights.includes(i));

    onCharacterUpdate({
        ...character,
        defects: permanentDefects,
        insights: finalInsights, // Only keep insights that were explicitly kept
    });
    onClose();
  }
  
  const renderXpStep = () => (
    <>
        <h3 className="font-cinzel text-2xl mb-4">Award Experience</h3>
        <p className="text-stone-400 mb-4">Answer the questions below. You get 1 XP for each "yes".</p>
        <div className="space-y-2">
            {XP_QUESTIONS.map((q, i) => (
                <label key={i} className="flex items-center space-x-3 p-2 bg-stone-700/50 rounded">
                    <input type="checkbox" checked={xpAnswers[i]} onChange={() => handleXpCheck(i)} className="form-checkbox h-5 w-5 bg-stone-800 border-stone-600 text-emerald-600 focus:ring-emerald-500"/>
                    <span>{q}</span>
                </label>
            ))}
        </div>
        <button onClick={confirmXp} className="mt-6 w-full p-2 bg-emerald-800 hover:bg-emerald-700 rounded font-semibold">
            Confirm {xpAnswers.filter(Boolean).length} XP & Continue
        </button>
    </>
  );
  
  const renderRecoveryStep = () => (
    <>
      <h3 className="font-cinzel text-2xl mb-4">Recovery: Defects & Insights</h3>
      <p className="text-stone-400 mb-4">Roll to see if your new injuries become permanent. Spend successes to heal Defects or solidify Insights.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical */}
        <div className="bg-stone-700/50 p-3 rounded space-y-2">
            <h4 className="text-lg font-semibold text-red-400">Physical Recovery</h4>
            <p className="text-sm text-stone-300 mb-2">Roll Physique + Precision ({character.attributes.Physique + character.attributes.Precision} dice)</p>
            <button onClick={() => rollRecovery('physical')} disabled={!!physRoll} className="w-full p-1 bg-red-800 rounded disabled:opacity-50">Roll for Physical Recovery</button>
            {physRoll && (
                <div className="mt-2 text-center border-t border-stone-600 pt-2">
                    <p>Rolled: {physRoll.result.join(', ')}</p>
                    <p className="font-bold text-xl text-emerald-300">{physRoll.successes} Successes to Spend</p>
                </div>
            )}
            {character.defects.filter(d => d.type === 'physical').map(d => (
                <div key={d.name} className="flex justify-between items-center bg-stone-800/50 p-2 rounded">
                    <div><span className="font-bold text-red-300">{d.name}</span> <span className="text-sm text-stone-400"> (Defect)</span></div>
                    <button onClick={() => spendSuccess('physical', 'heal', d)} disabled={physSuccessesToSpend < 1 || !permanentDefects.includes(d)} className="text-xs px-2 py-1 bg-emerald-700 rounded disabled:bg-stone-600">Heal</button>
                </div>
            ))}
        </div>
        {/* Mental */}
        <div className="bg-stone-700/50 p-3 rounded space-y-2">
            <h4 className="text-lg font-semibold text-sky-400">Mental Recovery</h4>
            <p className="text-sm text-stone-300 mb-2">Roll Logic + Empathy ({character.attributes.Logic + character.attributes.Empathy} dice)</p>
            <button onClick={() => rollRecovery('mental')} disabled={!!mentalRoll} className="w-full p-1 bg-sky-800 rounded disabled:opacity-50">Roll for Mental Recovery</button>
            {mentalRoll && (
                 <div className="mt-2 text-center border-t border-stone-600 pt-2">
                    <p>Rolled: {mentalRoll.result.join(', ')}</p>
                    <p className="font-bold text-xl text-emerald-300">{mentalRoll.successes} Successes to Spend</p>
                </div>
            )}
            {character.defects.filter(d => d.type === 'mental').map(d => (
                <div key={d.name} className="flex justify-between items-center bg-stone-800/50 p-2 rounded">
                     <div><span className="font-bold text-red-300">{d.name}</span> <span className="text-sm text-stone-400"> (Defect)</span></div>
                    <button onClick={() => spendSuccess('mental', 'heal', d)} disabled={mentalSuccessesToSpend < 1 || !permanentDefects.includes(d)} className="text-xs px-2 py-1 bg-emerald-700 rounded disabled:bg-stone-600">Heal</button>
                </div>
            ))}
        </div>
      </div>
      <div className="mt-4 bg-stone-700/30 p-3 rounded">
        <h4 className="text-lg font-cinzel text-center">Outcome</h4>
        <div className="text-sm grid grid-cols-2 gap-2 text-center">
            <div>
                <p className="font-bold text-red-400">Permanent Defects</p>
                {permanentDefects.length > 0 ? permanentDefects.map(d => <p key={d.name}>{d.name}</p>) : <p className="italic text-stone-400">None</p>}
            </div>
            <div>
                <p className="font-bold text-sky-400">Permanent Insights</p>
                <p className="italic text-stone-400">(All insights are lost unless solidified)</p>
            </div>
        </div>
      </div>
      <button onClick={finish} className="mt-6 w-full p-2 bg-emerald-800 hover:bg-emerald-700 rounded font-semibold">Finish & Save Changes</button>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
      <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-full max-w-3xl">
        {step === 'xp' ? renderXpStep() : renderRecoveryStep()}
         <button onClick={onClose} className="mt-2 w-full text-center text-sm text-stone-400 hover:text-stone-200">Cancel</button>
      </div>
    </div>
  );
};

export default EndMysteryModal;
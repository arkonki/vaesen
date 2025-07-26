import React, { useState, useMemo, useEffect } from 'react';
import { Character, Attribute, Skill } from '../types';
import { SKILLS_LIST } from '../constants';

interface DiceRollerProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  isModal?: boolean;
  initialSkill?: Skill;
  isAttributeOnly?: boolean;
  onClose?: () => void;
}
interface RollHistory {
    result: number[];
    successes: number;
    pushed: boolean;
    skill: string;
    totalDice: number;
}

const DiceRollerContent: React.FC<DiceRollerProps> = ({ character, onCharacterUpdate, isModal, initialSkill, isAttributeOnly, onClose }) => {
  const [mode, setMode] = useState<'skill' | 'fear'>(isModal ? 'skill' : 'skill');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(initialSkill || Skill.Agility);
  const [modifier, setModifier] = useState(0);
  
  const [fearValue, setFearValue] = useState(1);
  const [resistingAttribute, setResistingAttribute] = useState<Attribute.Logic | Attribute.Empathy>(Attribute.Logic);
  const [companions, setCompanions] = useState(0);

  const [rollResult, setRollResult] = useState<number[]>([]);
  const [successes, setSuccesses] = useState(0);
  const [canPush, setCanPush] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [rollHistory, setRollHistory] = useState<RollHistory[]>([]);
  const [fearResult, setFearResult] = useState<string | null>(null);
  
  useEffect(() => {
    if (isModal && initialSkill) {
        setSelectedSkill(initialSkill);
        setRollResult([]);
        setModifier(0);
        setCanPush(false);
        setPushed(false);
        setFearResult(null);
    }
  }, [isModal, initialSkill]);


  const selectedSkillInfo = useMemo(() => SKILLS_LIST.find(s => s.name === selectedSkill), [selectedSkill]);
  
  const physicalConditions = character.conditions.filter(c => c.type === 'physical' && c.active).length;
  const mentalConditions = character.conditions.filter(c => c.type === 'mental' && c.active).length;

  const { totalDice, conditionPenalty, baseDice, title, isBroken } = useMemo(() => {
    const totalConditions = physicalConditions + mentalConditions;
    
    const isPhysicallyBroken = physicalConditions >= 3;
    const isMentallyBroken = mentalConditions >= 3;

    if (mode === 'skill') {
      if (!selectedSkillInfo) return { totalDice: 0, conditionPenalty: 0, baseDice: 0, title: '', isBroken: false };
      const attr = selectedSkillInfo.attribute;
      
      const isAffectedByPhysicalBroken = attr === Attribute.Physique || attr === Attribute.Precision;
      const isAffectedByMentalBroken = attr === Attribute.Logic || attr === Attribute.Empathy;
      const characterIsBrokenForSkill = (isPhysicallyBroken && isAffectedByPhysicalBroken) || (isMentallyBroken && isAffectedByMentalBroken);

      const skillValue = isAttributeOnly ? 0 : (character.skills[selectedSkill] || 0);
      const base = character.attributes[attr] + skillValue;
      const finalTitle = isAttributeOnly ? `${attr} Test` : `${selectedSkill} Test`;

      if (characterIsBrokenForSkill) {
        return { title: finalTitle, baseDice: base, conditionPenalty: totalConditions, totalDice: 0, isBroken: true };
      }
      
      return { title: finalTitle, baseDice: base, conditionPenalty: totalConditions, totalDice: Math.max(1, base + modifier - totalConditions), isBroken: false };
    } else { // Fear Test
      const base = character.attributes[resistingAttribute];
      // Fear tests are not skills, so broken state doesn't prevent them. The penalty still applies.
      return { title: 'Fear Test', baseDice: base, conditionPenalty: totalConditions, totalDice: Math.max(1, base + Math.min(3, companions) - totalConditions), isBroken: false };
    }
  }, [mode, selectedSkill, selectedSkillInfo, character, modifier, physicalConditions, mentalConditions, resistingAttribute, companions, isAttributeOnly]);
  
  const updateHistory = (result: number[], successCount: number, wasPushed: boolean) => {
    const newHistoryEntry: RollHistory = {
        result,
        successes: successCount,
        pushed: wasPushed,
        skill: mode === 'skill' ? title : `Fear Test (vs ${fearValue})`,
        totalDice: result.length,
    };
    setRollHistory(prev => [newHistoryEntry, ...prev].slice(0, 5));
  }

  const rollDice = () => {
    const results = Array.from({ length: totalDice }, () => Math.ceil(Math.random() * 6));
    const successCount = results.filter(r => r === 6).length;
    setRollResult(results);
    setSuccesses(successCount);
    setCanPush(mode === 'skill');
    setPushed(false);
    setFearResult(null);

    if (mode === 'fear') {
      if (successCount >= fearValue) {
        setFearResult(`Success! You resisted the fear.`);
      } else {
        const conditionsToTake = fearValue - successCount;
        setFearResult(`You become Terrified and must take ${conditionsToTake} mental condition${conditionsToTake > 1 ? 's' : ''}.`);
      }
    }
    
    if(!isModal) updateHistory(results, successCount, false);
  };

  const pushRoll = () => {
    if (mode !== 'skill' || !selectedSkillInfo) return;

    const conditionType = (selectedSkillInfo.attribute === Attribute.Physique || selectedSkillInfo.attribute === Attribute.Precision) ? 'physical' : 'mental';
    const availableConditions = character.conditions.filter(c => c.type === conditionType && !c.active);

    if (availableConditions.length === 0) {
      alert(`You are already Broken and cannot take another ${conditionType} condition.`);
      return;
    }
    
    const conditionToTake = availableConditions[0];
    const updatedConditions = character.conditions.map(c => c.name === conditionToTake.name ? {...c, active: true} : c);
    onCharacterUpdate({...character, conditions: updatedConditions});
    
    const diceToPush = rollResult.filter(r => r !== 6).length;
    const newResults = Array.from({ length: diceToPush }, () => Math.ceil(Math.random() * 6));
    const oldSuccesses = rollResult.filter(r => r === 6);
    
    const finalResult = [...oldSuccesses, ...newResults];
    const finalSuccessCount = finalResult.filter(r => r === 6).length;
    
    setRollResult(finalResult);
    setSuccesses(finalSuccessCount);
    setCanPush(false);
    setPushed(true);
    if(!isModal) updateHistory(finalResult, finalSuccessCount, true);
  };
  
  const skillRollUI = (
    <>
      <div className={`grid grid-cols-1 ${isModal ? '' : 'md:grid-cols-2'} gap-4 mb-6`}>
            {!isModal && (
              <div>
                  <label className="block text-stone-400 mb-1">Skill</label>
                  <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value as Skill)} className="w-full bg-stone-800 p-2 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {SKILLS_LIST.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
              </div>
            )}
            <div>
                <label className="block text-stone-400 mb-1">Modifier</label>
                <input type="number" value={modifier} onChange={e => setModifier(parseInt(e.target.value) || 0)} className="w-full bg-stone-800 p-2 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
        </div>
        <div className="text-center mb-6 p-4 bg-stone-800/50 rounded">
            <p className="text-lg">{baseDice} <span className="text-stone-400">(Base)</span> + {modifier} <span className="text-stone-400">(Mod)</span> - {conditionPenalty} <span className="text-stone-400">(Total Cond)</span> = <span className="text-3xl font-bold text-emerald-400 ml-2">{totalDice}</span> Dice</p>
        </div>
    </>
  );

  const fearRollUI = (
     <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
                <label className="block text-stone-400 mb-1">Fear Value</label>
                <input type="number" value={fearValue} onChange={e => setFearValue(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-stone-800 p-2 rounded border border-stone-600" />
            </div>
            <div>
                <label className="block text-stone-400 mb-1">Resist With</label>
                <select value={resistingAttribute} onChange={e => setResistingAttribute(e.target.value as Attribute.Logic | Attribute.Empathy)} className="w-full bg-stone-800 p-2 rounded border border-stone-600">
                    <option value={Attribute.Logic}>Logic</option>
                    <option value={Attribute.Empathy}>Empathy</option>
                </select>
            </div>
                <div>
                <label className="block text-stone-400 mb-1">Companions (+3 Max)</label>
                <input type="number" value={companions} onChange={e => setCompanions(parseInt(e.target.value) || 0)} className="w-full bg-stone-800 p-2 rounded border border-stone-600" />
            </div>
        </div>
        <div className="text-center mb-6 p-4 bg-stone-800/50 rounded">
            <p className="text-lg">{baseDice} <span className="text-stone-400">(Attribute)</span> + {Math.min(3, companions)} <span className="text-stone-400">(Companions)</span> - {conditionPenalty} <span className="text-stone-400">(Total Cond)</span> = <span className="text-3xl font-bold text-emerald-400 ml-2">{totalDice}</span> Dice</p>
        </div>
    </>
  );

  const isFearSuccess = fearResult && fearResult.startsWith('Success');
  const isFearFailure = fearResult && !fearResult.startsWith('Success');

  return (
    <div className={isModal ? "" : "grid grid-cols-1 md:grid-cols-3 gap-6"}>
      <div className={isModal ? "" : "md:col-span-2 p-6 bg-stone-900/60 rounded-lg border border-stone-700 shadow-xl"}>
        {!isModal && (
            <div className="flex justify-center border-b border-stone-700 mb-6">
                <button onClick={() => setMode('skill')} className={`font-cinzel text-xl px-6 py-2 transition-colors ${mode==='skill' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-stone-500'}`}>Skill Test</button>
                <button onClick={() => setMode('fear')} className={`font-cinzel text-xl px-6 py-2 transition-colors ${mode==='fear' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-stone-500'}`}>Fear Test</button>
            </div>
        )}
        
        {isModal && <h3 className="font-cinzel text-2xl mb-4 text-center">{title}</h3>}

        {mode === 'skill' ? skillRollUI : fearRollUI}
        
        <div className="flex justify-center space-x-4 mb-6">
          <button onClick={rollDice} disabled={isBroken} className="font-cinzel text-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-stone-600 disabled:cursor-not-allowed">
            {isBroken ? 'Character is Broken' : 'Roll'}
          </button>
          {canPush && (
            <button onClick={pushRoll} className="font-cinzel text-xl bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">
              Push The Roll
            </button>
          )}
        </div>

        {rollResult.length > 0 && (
          <div className="mt-6 text-center">
              {pushed && <p className="text-red-400 mb-2 font-semibold">You took a condition and pushed the roll!</p>}
              <h3 className="font-cinzel text-2xl mb-4">Result: <span className="text-emerald-400">{successes} Successes</span></h3>

              {isFearFailure && <h4 className="text-5xl font-cinzel text-red-500 my-4 animate-pulse">TERRIFIED!</h4>}
              
              {fearResult && <p className={`mb-4 text-lg font-semibold ${isFearSuccess ? 'text-emerald-300' : 'text-red-400'}`}>{fearResult}</p>}

              <div className="flex flex-wrap justify-center gap-2">
                  {rollResult.map((r, i) => (
                      <div key={i} className={`w-16 h-16 flex items-center justify-center text-3xl font-bold rounded-md pop-in ${r === 6 ? 'bg-emerald-500 text-white' : 'bg-stone-700'}`}>
                          {r}
                      </div>
                  ))}
              </div>
          </div>
        )}
      </div>
      {!isModal && (
        <div className="md:col-span-1 p-4 bg-stone-900/60 rounded-lg border border-stone-700">
            <h3 className="font-cinzel text-2xl mb-4 border-b border-stone-600 pb-2">Roll History</h3>
            <div className="space-y-3">
                {rollHistory.length === 0 && <p className="text-stone-500 text-center italic mt-4">No rolls yet.</p>}
                {rollHistory.map((roll, i) => (
                    <div key={i} className="bg-stone-800/50 p-2 rounded">
                        <p className="font-semibold">{roll.skill}: <span className="text-emerald-400">{roll.successes} success{roll.successes !== 1 && 'es'}</span> on {roll.totalDice} dice</p>
                        <p className="text-xs text-stone-400">Rolled: {roll.result.join(', ')} {roll.pushed && <span className="text-red-400 font-bold">(Pushed)</span>}</p>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  )
}

const DiceRoller: React.FC<DiceRollerProps> = (props) => {
    if (props.isModal) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
                <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-full max-w-lg relative">
                    <button onClick={props.onClose} className="absolute top-2 right-2 text-2xl text-stone-500 hover:text-stone-200">&times;</button>
                    <DiceRollerContent {...props} />
                </div>
            </div>
        );
    }
    return <DiceRollerContent {...props} />;
}


export default DiceRoller;
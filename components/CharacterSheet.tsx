import React, { useState } from 'react';
import { Character, Skill, DefectInsight, Attribute } from '../types';
import { SKILLS_LIST, TALENT_DESCRIPTIONS, PHYSICAL_CRITICAL_INJURIES, MENTAL_CRITICAL_INJURIES } from '../constants';
import EndMysteryModal from './EndMysteryModal';
import DiceRoller from './DiceRoller';

const ALL_TALENTS = Object.keys(TALENT_DESCRIPTIONS).sort();

interface CharacterSheetProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

const StatBox: React.FC<{ label: string; value: string | number; isMain?: boolean; onRoll: () => void; }> = ({ label, value, isMain = false, onRoll }) => (
  <div className={`border border-stone-600 p-3 rounded-md text-center ${isMain ? 'bg-emerald-900/50 border-emerald-700' : 'bg-stone-800/50'} flex flex-col justify-between`}>
    <div>
        <div className={`font-cinzel text-lg ${isMain ? 'text-emerald-300' : 'text-stone-300'}`}>{label}</div>
        <div className="text-4xl font-semibold text-white">{value}</div>
    </div>
    <button onClick={onRoll} className="text-xs font-semibold text-emerald-400 hover:text-emerald-200 mt-2">[ ROLL ]</button>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-stone-900/60 p-4 rounded-lg border border-stone-700 shadow-lg ${className}`}>
    <h3 className="font-cinzel text-xl border-b-2 border-stone-600 pb-2 mb-3 text-stone-200">{title}</h3>
    {children}
  </div>
);

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onCharacterUpdate }) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showMementoModal, setShowMementoModal] = useState(false);
  const [showEndMysteryModal, setShowEndMysteryModal] = useState(false);
  const [showAddInjuryModal, setShowAddInjuryModal] = useState(false);
  const [newRelationship, setNewRelationship] = useState({ name: '', description: '' });
  const [rollModalConfig, setRollModalConfig] = useState<{ skill: Skill; isAttributeOnly: boolean } | null>(null);


  const handleToggleCondition = (conditionName: string) => {
    const updatedConditions = character.conditions.map(c =>
      c.name === conditionName ? { ...c, active: !c.active } : c
    );
    onCharacterUpdate({ ...character, conditions: updatedConditions });
  };
  
  const handleXpChange = (amount: number) => {
    const newXp = Math.max(0, character.xp + amount);
    onCharacterUpdate({...character, xp: newXp});
  };

  const handleSpendAdvance = () => {
    if (character.xp >= 5) {
      setShowAdvanceModal(true);
    } else {
      alert("Not enough XP. You need 5 XP to buy an advance.");
    }
  };
  
  const handleAdvance = (type: 'skill' | 'talent', value: string) => {
    let updatedChar = {...character, xp: character.xp - 5};
    if (type === 'skill') {
        const skill = value as Skill;
        const currentVal = updatedChar.skills[skill] || 0;
        if (currentVal < 5) {
            updatedChar.skills = {...updatedChar.skills, [skill]: currentVal + 1};
        } else {
            alert("Skill is already at maximum level (5).");
            return;
        }
    } else {
        if (!updatedChar.talents.includes(value)) {
            updatedChar.talents = [...updatedChar.talents, value];
        } else {
            alert("You already have this talent.");
            return;
        }
    }
    onCharacterUpdate(updatedChar);
    setShowAdvanceModal(false);
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue);
  }

  const handleSave = (field: keyof Character) => {
    if(typeof character[field] === 'string'){
      onCharacterUpdate({ ...character, [field]: editValue.trim() });
    }
    setEditing(null);
  };
  
  const handleHealWithMemento = (conditionName: string) => {
    handleToggleCondition(conditionName);
    setShowMementoModal(false);
  }
  
  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRelationship.name.trim()) {
        const updatedRelationships = [...character.relationships, { name: newRelationship.name.trim(), description: newRelationship.description.trim() }];
        onCharacterUpdate({...character, relationships: updatedRelationships});
        setNewRelationship({ name: '', description: '' });
    }
  }

  const handleRemoveRelationship = (index: number) => {
    const updatedRelationships = character.relationships.filter((_, i) => i !== index);
    onCharacterUpdate({...character, relationships: updatedRelationships});
  }

  const handleAddInjury = (injury: DefectInsight, type: 'defect' | 'insight') => {
      if (type === 'defect') {
          onCharacterUpdate({...character, defects: [...character.defects, injury]});
      } else {
          onCharacterUpdate({...character, insights: [...character.insights, injury]});
      }
      setShowAddInjuryModal(false);
  }

  const handleRemoveDefect = (index: number) => {
      const updated = character.defects.filter((_, i) => i !== index);
      onCharacterUpdate({...character, defects: updated});
  }

  const handleRemoveInsight = (index: number) => {
      const updated = character.insights.filter((_, i) => i !== index);
      onCharacterUpdate({...character, insights: updated});
  }
  
  const getSkillForAttribute = (attribute: Attribute): Skill => {
    return SKILLS_LIST.find(s => s.attribute === attribute)!.name;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <Section title="Portrait">
                {character.portraitUrl ? (
                    <div>
                        <img src={character.portraitUrl} alt={character.name} className="w-full h-auto object-cover rounded"/>
                        <button onClick={() => onCharacterUpdate({...character, portraitUrl: ''})} className="text-xs text-red-400 hover:underline mt-1 w-full text-center">Remove</button>
                    </div>
                ) : (
                    <div>
                         <input
                            type="text"
                            placeholder="Image URL"
                            onBlur={(e) => onCharacterUpdate({...character, portraitUrl: e.target.value.trim()})}
                            defaultValue={character.portraitUrl}
                            className="w-full bg-stone-800 p-2 rounded border border-stone-600 text-sm"
                        />
                        <p className="text-xs text-stone-500 mt-1">Paste a URL to an image of your character.</p>
                    </div>
                )}
            </Section>
            <Section title="Details">
              {[ 'motivation', 'trauma', 'darkSecret'].map(field => (
                  <div key={field} className="mb-2">
                      <h4 className="font-cinzel text-stone-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</h4>
                       {editing === field ? (
                          <div className="flex">
                              <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-stone-800 p-1 rounded-l h-24 resize-none"/>
                              <button onClick={() => handleSave(field as keyof Character)} className="bg-emerald-700 px-2 rounded-r">Save</button>
                          </div>
                      ) : (
                          <p className="text-stone-200 cursor-pointer hover:bg-stone-800 p-1" onClick={() => handleEdit(field, character[field as keyof Character] as string)}>
                              {character[field as keyof Character] as string}
                          </p>
                      )}
                  </div>
              ))}
            </Section>
            <Section title="Memento">
              <p className="text-stone-200 mb-2">{character.memento}</p>
              <button 
                onClick={() => setShowMementoModal(true)} 
                disabled={character.conditions.filter(c => c.active).length === 0}
                className="w-full text-sm bg-emerald-800 px-2 py-1 rounded disabled:bg-stone-600 disabled:cursor-not-allowed"
              >
                Use Memento to Heal
              </button>
            </Section>
            <Section title="Campaign Actions">
                <button onClick={() => setShowEndMysteryModal(true)} className="w-full text-sm bg-emerald-800 px-2 py-1 rounded">End of Mystery</button>
            </Section>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900/60 p-4 rounded-lg border border-stone-700 shadow-lg flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-cinzel">{character.name}</h2>
              <p className="text-xl text-stone-300">{character.archetype.name} - {character.age}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <span className="font-cinzel text-xl mr-2">XP: {character.xp}</span>
                <button onClick={() => handleXpChange(-1)} className="w-6 h-6 bg-stone-700 rounded">-</button>
                <button onClick={() => handleXpChange(1)} className="w-6 h-6 bg-stone-700 rounded ml-1">+</button>
              </div>
              <button onClick={handleSpendAdvance} className="text-sm mt-1 bg-emerald-800 px-2 py-1 rounded disabled:bg-stone-600" disabled={character.xp < 5}>Spend 5 XP</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <StatBox 
                key={attr} 
                label={attr} 
                value={value} 
                isMain={attr === character.archetype.mainAttribute} 
                onRoll={() => setRollModalConfig({ skill: getSkillForAttribute(attr as Attribute), isAttributeOnly: true })}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Skills">
              <ul className="space-y-1 text-lg">
                {SKILLS_LIST.map(({ name }) => (
                  <li key={name} className={`flex justify-between items-center p-1 rounded ${name === character.archetype.mainSkill ? 'bg-emerald-900/40' : ''}`}>
                    <div className="flex items-center">
                      <span className={name === character.archetype.mainSkill ? 'text-emerald-300' : ''}>{name}</span>
                      <button onClick={() => setRollModalConfig({ skill: name, isAttributeOnly: false })} className="text-xs font-semibold text-emerald-500 hover:text-emerald-300 ml-3">[ROLL]</button>
                    </div>
                    <span className="font-bold">{character.skills[name] || 0}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Conditions">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <h4 className="text-stone-400 font-semibold">Physical</h4>
                  {character.conditions.filter(c => c.type === 'physical').map(c => (
                    <label key={c.name} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={c.active} onChange={() => handleToggleCondition(c.name)} className="form-checkbox h-5 w-5 bg-stone-800 border-stone-600 text-emerald-600 focus:ring-emerald-500"/>
                      <span className={c.active ? 'line-through text-red-400' : ''}>{c.name}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  <h4 className="text-stone-400 font-semibold">Mental</h4>
                  {character.conditions.filter(c => c.type === 'mental').map(c => (
                    <label key={c.name} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={c.active} onChange={() => handleToggleCondition(c.name)} className="form-checkbox h-5 w-5 bg-stone-800 border-stone-600 text-emerald-600 focus:ring-emerald-500"/>
                      <span className={c.active ? 'line-through text-red-400' : ''}>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>
          </div>
           <Section title="Talents">
                <div className="flex flex-wrap gap-2">
                    {character.talents.map(talent => (
                        <div key={talent} className="relative group bg-stone-800/70 border border-stone-700 px-3 py-1 rounded-full text-sm cursor-help">
                            {talent}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-stone-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {TALENT_DESCRIPTIONS[talent] || "No description available."}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Section title="Equipment">
              <div className="flex flex-wrap gap-2">
                {character.equipment.map((item, index) => (
                    <span key={index} className="bg-stone-800/70 border border-stone-700 px-3 py-1 rounded-full text-sm">
                        {item}
                    </span>
                ))}
              </div>
            </Section>
             <Section title="Defects & Insights">
                <div className="space-y-3">
                    {character.defects.map((defect, i) => (
                        <div key={`defect-${i}`} className="bg-red-900/30 p-2 rounded group relative">
                            <h4 className="font-bold text-red-300">Defect: {defect.name}</h4>
                            <p className="text-sm text-stone-400">{defect.description}</p>
                             <button onClick={() => handleRemoveDefect(i)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                        </div>
                    ))}
                     {character.insights.map((insight, i) => (
                        <div key={`insight-${i}`} className="bg-sky-900/30 p-2 rounded group relative">
                            <h4 className="font-bold text-sky-300">Insight: {insight.name}</h4>
                            <p className="text-sm text-stone-400">{insight.description}</p>
                            <button onClick={() => handleRemoveInsight(i)} className="absolute top-1 right-1 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                        </div>
                    ))}
                </div>
                 <button onClick={() => setShowAddInjuryModal(true)} className="w-full text-sm bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded mt-3">Add Injury</button>
            </Section>
            <Section title="Relationships & NPCs">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {character.relationships.map((rel, index) => (
                        <div key={index} className="bg-stone-800/50 p-2 rounded group relative">
                            <h4 className="font-bold text-stone-200">{rel.name}</h4>
                            <p className="text-sm text-stone-400">{rel.description}</p>
                            <button onClick={() => handleRemoveRelationship(index)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddRelationship} className="mt-4 flex space-x-2 border-t border-stone-700 pt-3">
                    <input type="text" placeholder="Name" value={newRelationship.name} onChange={e => setNewRelationship({...newRelationship, name: e.target.value.trim()})} className="flex-1 bg-stone-800 p-1 rounded border border-stone-600 text-sm"/>
                    <input type="text" placeholder="Description" value={newRelationship.description} onChange={e => setNewRelationship({...newRelationship, description: e.target.value})} className="flex-1 bg-stone-800 p-1 rounded border border-stone-600 text-sm"/>
                    <button type="submit" className="bg-emerald-800 px-2 rounded text-lg">+</button>
                </form>
            </Section>
        </div>
      </div>
       {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-full max-w-lg">
            <h3 className="font-cinzel text-2xl mb-4">Spend 5 XP for an Advance</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-emerald-400 mb-2">Increase a Skill</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS_LIST.map(({ name: skill }) => (
                    <button 
                      key={skill}
                      onClick={() => handleAdvance('skill', skill)}
                      disabled={(character.skills[skill] || 0) >= 5}
                      className="text-left p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-50 flex justify-between"
                    >
                      <span>{skill}</span>
                      <span>{(character.skills[skill] || 0)} &rarr; {(character.skills[skill] || 0) + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-emerald-400 mb-2">Buy a New Talent</h4>
                <div className="max-h-60 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-2">
                  {ALL_TALENTS.filter(t => !character.talents.includes(t)).map(talent => (
                    <button 
                      key={talent}
                      onClick={() => handleAdvance('talent', talent)}
                      className="text-left p-2 bg-stone-700 hover:bg-stone-600 rounded"
                    >
                      {talent}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowAdvanceModal(false)} className="mt-6 w-full p-2 bg-red-800 hover:bg-red-700 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}
       {showMementoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
            <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-full max-w-md">
                <h3 className="font-cinzel text-2xl mb-4">Use Memento</h3>
                <p className="text-stone-400 mb-4">Choose a condition to heal by interacting with your memento: <span className="text-stone-200 italic">"{character.memento}"</span>.</p>
                <div className="space-y-2">
                    {character.conditions.filter(c => c.active).map(c => (
                        <button key={c.name} onClick={() => handleHealWithMemento(c.name)} className="w-full p-2 bg-stone-700 hover:bg-stone-600 rounded text-left">
                           Heal {c.name}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowMementoModal(false)} className="mt-6 w-full p-2 bg-stone-700 hover:bg-stone-600 rounded">
                  Close
                </button>
            </div>
        </div>
       )}
       {showAddInjuryModal && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
           <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-full max-w-3xl">
             <h3 className="font-cinzel text-2xl mb-4">Add Critical Injury</h3>
             <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <h4 className="text-lg font-semibold text-red-400 mb-2">Physical Injuries</h4>
                  {PHYSICAL_CRITICAL_INJURIES.map(injury => (
                    <button key={injury.name} onClick={() => handleAddInjury(injury, injury.description.includes('+') ? 'insight' : 'defect')} className="w-full text-left p-2 bg-stone-700 hover:bg-stone-600 rounded mb-1 text-sm">
                      <strong>{injury.name}</strong>: {injury.description}
                    </button>
                  ))}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-sky-400 mb-2">Mental Injuries</h4>
                  {MENTAL_CRITICAL_INJURIES.map(injury => (
                    <button key={injury.name} onClick={() => handleAddInjury(injury, injury.description.includes('+') ? 'insight' : 'defect')} className="w-full text-left p-2 bg-stone-700 hover:bg-stone-600 rounded mb-1 text-sm">
                      <strong>{injury.name}</strong>: {injury.description}
                    </button>
                  ))}
                </div>
             </div>
             <button onClick={() => setShowAddInjuryModal(false)} className="mt-6 w-full p-2 bg-stone-700 hover:bg-stone-600 rounded">Close</button>
           </div>
         </div>
       )}
       {showEndMysteryModal && (
        <EndMysteryModal 
            character={character}
            onCharacterUpdate={onCharacterUpdate}
            onClose={() => setShowEndMysteryModal(false)}
        />
       )}
       {rollModalConfig && (
         <DiceRoller 
            isModal={true}
            initialSkill={rollModalConfig.skill}
            isAttributeOnly={rollModalConfig.isAttributeOnly}
            character={character}
            onCharacterUpdate={onCharacterUpdate}
            onClose={() => setRollModalConfig(null)}
         />
       )}
    </>
  );
};

export default CharacterSheet;

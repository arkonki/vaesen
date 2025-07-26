
import React, { useState, useMemo, useEffect } from 'react';
import { Character, AgeGroup, Archetype, Attribute, Skill, Headquarters, Upgrade, CampaignCreationData } from '../types';
import { ARCHETYPES, MEMENTOS, SKILLS_LIST, UPGRADES } from '../constants';
import { GoogleGenAI } from '@google/genai';


interface CharacterCreatorProps {
  onCampaignCreated: (campaignData: CampaignCreationData) => void;
  onBack: () => void;
}

const initialSkills: Record<Skill, number> = SKILLS_LIST.reduce((acc, skillInfo) => {
  acc[skillInfo.name] = 0;
  return acc;
}, {} as Record<Skill, number>);

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCampaignCreated, onBack }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState<AgeGroup>(AgeGroup.Young);
  const [archetypeName, setArchetype] = useState<string>(Object.keys(ARCHETYPES)[0]);
  
  const selectedArchetype = useMemo(() => ARCHETYPES[archetypeName], [archetypeName]);

  const [motivation, setMotivation] = useState(selectedArchetype.motivations[0]);
  const [trauma, setTrauma] = useState(selectedArchetype.traumas[0]);
  const [darkSecret, setDarkSecret] = useState(selectedArchetype.darkSecrets[0]);
  const [talent, setTalent] = useState(selectedArchetype.talents[0]);
  const [equipmentChoices, setEquipmentChoices] = useState<Record<number, string>>({});
  const [resources, setResources] = useState(selectedArchetype.resources[0]);
  const [memento, setMemento] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');

  // Portrait Generation State
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    if (step > 1) { 
        setMotivation(selectedArchetype.motivations[0]);
        setTrauma(selectedArchetype.traumas[0]);
        setDarkSecret(selectedArchetype.darkSecrets[0]);
        setTalent(selectedArchetype.talents[0]);
        setResources(selectedArchetype.resources[0]);
        const initialChoices: Record<number, string> = {};
        selectedArchetype.equipment.forEach((item, index) => {
            if (item.includes(' or ')) {
                initialChoices[index] = item.split(' or ')[0];
            }
        });
        setEquipmentChoices(initialChoices);
        setSkills(initialSkills);
        setAttributes({
          [Attribute.Physique]: 2,
          [Attribute.Precision]: 2,
          [Attribute.Logic]: 2,
          [Attribute.Empathy]: 2,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArchetype]);
  
  useEffect(() => {
    if (step === 6) {
        const aesthetic = "A portrait in the style of Johan Egerkrans for the Vaesen RPG, dark gothic horror, 19th century Sweden, moody, atmospheric, ink wash and watercolor, muted color palette.";
        const fullPrompt = `Full body portrait of a ${age.toLowerCase()} ${selectedArchetype.name}. ${aesthetic}`;
        setPrompt(fullPrompt);
        setGeneratedImage(null); // Clear previous image
    }
  }, [step, age, selectedArchetype]);


  const [attributes, setAttributes] = useState<Record<Attribute, number>>({
    [Attribute.Physique]: 2,
    [Attribute.Precision]: 2,
    [Attribute.Logic]: 2,
    [Attribute.Empathy]: 2,
  });

  const [skills, setSkills] = useState<Record<Skill, number>>(initialSkills);

  const ageConfig = useMemo(() => {
    switch (age) {
      case AgeGroup.Young: return { attrPoints: 15, skillPoints: 10 };
      case AgeGroup.MiddleAged: return { attrPoints: 14, skillPoints: 12 };
      case AgeGroup.Old: return { attrPoints: 13, skillPoints: 14 };
    }
  }, [age]);

  const totalAttrPoints = useMemo(() => Object.values(attributes).reduce((sum, val) => sum + val, 0), [attributes]);
  const attrPointsRemaining = ageConfig.attrPoints - totalAttrPoints;

  const resourceSkillPointCost = useMemo(() => Math.max(0, resources - selectedArchetype.resources[0]), [resources, selectedArchetype]);
  const totalSkillPoints = useMemo(() => Object.values(skills).reduce((sum, val) => sum + val, 0), [skills]);
  const skillPointsRemaining = ageConfig.skillPoints - totalSkillPoints - resourceSkillPointCost;
  
  const handleAttrChange = (attr: Attribute, value: number) => {
    const currentTotal = totalAttrPoints - attributes[attr];
    const maxVal = attr === selectedArchetype.mainAttribute ? 5 : 4;
    const newVal = Math.max(2, Math.min(maxVal, value));
    
    if (currentTotal + newVal > ageConfig.attrPoints && newVal > attributes[attr]) return;

    setAttributes(prev => ({ ...prev, [attr]: newVal }));
  };

  const handleSkillChange = (skill: Skill, value: number) => {
    const currentTotal = totalSkillPoints - skills[skill];
    const maxVal = skill === selectedArchetype.mainSkill ? 3 : 2;
    const newVal = Math.max(0, Math.min(maxVal, value));
    
    if (currentTotal + newVal > ageConfig.skillPoints - resourceSkillPointCost && newVal > skills[skill]) return;
    
    setSkills(prev => ({...prev, [skill]: newVal}));
  };
  
  const handleResourceChange = (amount: number) => {
    const newVal = resources + amount;
    if (newVal < selectedArchetype.resources[0] || newVal > selectedArchetype.resources[1]) return;
    const newCost = Math.max(0, newVal - selectedArchetype.resources[0]);
    if (amount > 0 && totalSkillPoints + newCost > ageConfig.skillPoints) return;
    setResources(newVal);
  }

  const handleGeneratePortrait = async () => {
    if (!prompt) return;
    setGenerating(true);
    setGeneratedImage(null);
    try {
        if (!process.env.API_KEY) {
            throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable in your Netlify deployment settings.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '3:4',
            },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        setGeneratedImage(imageUrl);
    } catch (error) {
        console.error("Error generating portrait:", error);
        alert("Failed to generate portrait. Please check the API Key and console for details.");
    } finally {
        setGenerating(false);
    }
  };

  const handleAcceptPortrait = () => {
    if (generatedImage) {
        setPortraitUrl(generatedImage);
        nextStep();
    }
  };


  const createCampaignData = () => {
    const finalEquipment = selectedArchetype.equipment.map((item, index) => {
        if(item.includes(' or ')) {
            return equipmentChoices[index] || item.split(' or ')[0];
        }
        return item;
    });

    const newCharacter: Character = {
        name: name.trim(),
        age,
        archetype: selectedArchetype,
        attributes,
        skills,
        talents: [talent],
        motivation,
        trauma,
        darkSecret,
        relationships: [],
        memento: memento,
        equipment: finalEquipment,
        resources: resources,
        conditions: [
            { name: 'Exhausted', type: 'physical', active: false },
            { name: 'Battered', type: 'physical', active: false },
            { name: 'Wounded', type: 'physical', active: false },
            { name: 'Angry', type: 'mental', active: false },
            { name: 'Frightened', type: 'mental', active: false },
            { name: 'Hopeless', type: 'mental', active: false },
        ],
        xp: 0,
        defects: [],
        insights: [],
        portraitUrl: portraitUrl,
    };
    
    const newHq: Headquarters = {
        name: 'Castle Gyllencreutz',
        developmentPoints: 0,
        upgrades: UPGRADES.map(u => ({...u}))
    };
    
    onCampaignCreated({
        character_data: newCharacter,
        headquarters_data: newHq,
        journal_data: ''
    });
  };
  
  const nextStep = () => {
    if (step === 1 && !name.trim()) {
        alert("Please enter a character name.");
        return;
    }
     if (step === 2 && attrPointsRemaining !== 0) {
        alert(`You must use all ${ageConfig.attrPoints} attribute points. You have ${attrPointsRemaining} remaining.`);
        return;
    }
     if (step === 3 && skillPointsRemaining !== 0) {
        alert(`You must use all ${ageConfig.skillPoints} skill points. You have ${skillPointsRemaining} remaining.`);
        return;
    }
    if (step === 7) {
        createCampaignData();
    } else {
      if (step === 6) { // moving to finalize step
        setMemento(MEMENTOS[Math.floor(Math.random() * MEMENTOS.length)]);
      }
      setStep(s => s + 1);
    }
  }
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const steps = ['Concept', 'Attributes', 'Skills', 'Background', 'Abilities', 'Portrait', 'Finalize'];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-cinzel text-center text-stone-100 mb-2">Create Your Character</h2>
      <p className="text-center text-stone-400 mb-8">Follow the steps below to forge your investigator of the supernatural.</p>
      
      <div className="flex justify-between items-center mb-8 px-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > i + 1 ? 'bg-emerald-700 border-emerald-500' : step === i + 1 ? 'bg-emerald-900 border-emerald-500' : 'bg-stone-700 border-stone-600'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <p className={`mt-1 text-xs ${step >= i + 1 ? 'text-stone-200' : 'text-stone-500'}`}>{s}</p>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mt-[-1.25rem] ${step > i + 1 ? 'bg-emerald-600' : 'bg-stone-600'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-stone-800/50 p-6 md:p-8 rounded-lg border border-stone-700 shadow-xl min-h-[50vh]">
        {step === 1 && (
          <div>
            <h3 className="font-cinzel text-3xl mb-6 text-center">Step 1: Concept</h3>
            <div className="space-y-6">
               <input type="text" placeholder="Character Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-900 p-3 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg" />
              <div>
                <h4 className="text-xl font-cinzel text-stone-300 mb-2">Choose your Archetype</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.keys(ARCHETYPES).map(key => (
                    <button key={key} onClick={() => setArchetype(key)} className={`p-3 rounded border-2 text-center transition-colors ${archetypeName === key ? 'bg-emerald-800/70 border-emerald-500' : 'bg-stone-700/50 border-stone-600 hover:bg-stone-700'}`}>{key}</button>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-stone-900/50 rounded border border-stone-700 min-h-[6rem]">
                  <p className="text-stone-400">{selectedArchetype.description}</p>
                </div>
              </div>
               <div>
                <h4 className="text-xl font-cinzel text-stone-300 mb-2">Choose your Age</h4>
                 <div className="flex space-x-4">
                  {Object.values(AgeGroup).map(ag => (
                    <button key={ag} onClick={() => setAge(ag)} className={`flex-1 p-3 rounded border-2 text-center transition-colors ${age === ag ? 'bg-emerald-800/70 border-emerald-500' : 'bg-stone-700/50 border-stone-600 hover:bg-stone-700'}`}>{ag}</button>
                  ))}
                </div>
                <p className="text-center mt-2 text-stone-400 text-sm">Attribute Points: {ageConfig.attrPoints}, Skill Points: {ageConfig.skillPoints}</p>
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h3 className="font-cinzel text-3xl mb-2 text-center">Step 2: Attributes</h3>
            <p className="text-center text-stone-400 mb-6">Distribute {ageConfig.attrPoints} points. Minimum 2, maximum 4 (or 5 for your Main Attribute).</p>
            <div className="max-w-md mx-auto space-y-4">
              <div className={`text-center p-3 rounded-lg text-2xl font-bold ${attrPointsRemaining === 0 ? 'bg-emerald-800/70 text-emerald-200' : 'bg-red-900/70 text-red-200'}`}>
                {attrPointsRemaining} Points Remaining
              </div>
              {Object.values(Attribute).map(attr => (
                  <div key={attr} className="flex items-center justify-between bg-stone-900/50 p-3 rounded-lg">
                      <label className={`font-cinzel text-xl ${attr === selectedArchetype.mainAttribute ? 'text-emerald-400' : ''}`}>{attr} {attr === selectedArchetype.mainAttribute ? '(Main)' : ''}</label>
                      <div className="flex items-center space-x-3">
                          <button onClick={() => handleAttrChange(attr, attributes[attr] - 1)} className="w-10 h-10 bg-stone-700 rounded text-xl">-</button>
                          <span className="w-10 text-center text-3xl font-semibold">{attributes[attr]}</span>
                          <button onClick={() => handleAttrChange(attr, attributes[attr] + 1)} className="w-10 h-10 bg-stone-700 rounded text-xl">+</button>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
            <div>
                 <h3 className="font-cinzel text-3xl mb-2 text-center">Step 3: Skills & Resources</h3>
                 <p className="text-center text-stone-400 mb-6">Distribute {ageConfig.skillPoints} points. Maximum 2, maximum 3 for your Main Skill.</p>
                 <div className={`text-center p-3 rounded-lg text-2xl font-bold mb-6 max-w-md mx-auto ${skillPointsRemaining === 0 ? 'bg-emerald-800/70 text-emerald-200' : 'bg-red-900/70 text-red-200'}`}>
                    {skillPointsRemaining} Points Remaining
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center justify-between bg-stone-900/50 p-3 rounded-lg md:col-span-2">
                        <label className={`font-cinzel text-xl text-amber-300`}>Resources</label>
                        <div className="flex items-center space-x-3">
                            <button onClick={() => handleResourceChange(-1)} className="w-10 h-10 bg-stone-700 rounded text-xl">-</button>
                            <span className="w-10 text-center text-3xl font-semibold">{resources}</span>
                            <button onClick={() => handleResourceChange(1)} className="w-10 h-10 bg-stone-700 rounded text-xl">+</button>
                        </div>
                    </div>
                    {SKILLS_LIST.map(({ name: skill, attribute }) => (
                      <div key={skill} className="flex items-center justify-between bg-stone-900/50 p-2 rounded-lg">
                          <label className={`font-semibold ${skill === selectedArchetype.mainSkill ? 'text-emerald-400' : ''}`}>{skill} <span className="text-xs text-stone-400">({attribute.slice(0,3)})</span></label>
                          <div className="flex items-center space-x-2">
                              <button onClick={() => handleSkillChange(skill, (skills[skill] || 0) - 1)} className="w-8 h-8 bg-stone-700 rounded">-</button>
                              <span className="w-8 text-center text-xl">{skills[skill] || 0}</span>
                              <button onClick={() => handleSkillChange(skill, (skills[skill] || 0) + 1)} className="w-8 h-8 bg-stone-700 rounded">+</button>
                          </div>
                      </div>
                  ))}
                </div>
            </div>
        )}
        
        {step === 4 && (
          <div>
            <h3 className="font-cinzel text-3xl mb-6 text-center">Step 4: Background</h3>
            <div className="max-w-lg mx-auto space-y-6">
                <div>
                    <label className="text-xl font-cinzel text-stone-300">Motivation</label>
                    <p className="text-sm text-stone-400 mb-2">Why do you risk your life to hunt vaesen?</p>
                    <select value={motivation} onChange={e => setMotivation(e.target.value)} className="w-full bg-stone-900 p-2 rounded border border-stone-600 mt-1">
                        {selectedArchetype.motivations.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xl font-cinzel text-stone-300">Trauma</label>
                    <p className="text-sm text-stone-400 mb-2">What supernatural event gave you the Sight?</p>
                    <select value={trauma} onChange={e => setTrauma(e.target.value)} className="w-full bg-stone-900 p-2 rounded border border-stone-600 mt-1">
                        {selectedArchetype.traumas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xl font-cinzel text-stone-300">Dark Secret</label>
                    <p className="text-sm text-stone-400 mb-2">What shameful secret do you keep from the others?</p>
                    <select value={darkSecret} onChange={e => setDarkSecret(e.target.value)} className="w-full bg-stone-900 p-2 rounded border border-stone-600 mt-1">
                        {selectedArchetype.darkSecrets.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
          </div>
        )}

        {step === 5 && (
            <div>
                 <h3 className="font-cinzel text-3xl mb-6 text-center">Step 5: Abilities & Equipment</h3>
                 <div className="max-w-lg mx-auto space-y-6">
                    <div>
                        <label className="text-xl font-cinzel text-stone-300">Talent</label>
                        <p className="text-sm text-stone-400 mb-2">Choose one of your Archetype's starting talents.</p>
                        <select value={talent} onChange={e => setTalent(e.target.value)} className="w-full bg-stone-900 p-2 rounded border border-stone-600 mt-1">
                            {selectedArchetype.talents.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <h4 className="text-xl font-cinzel text-stone-300">Equipment</h4>
                        <p className="text-sm text-stone-400 mb-2">Your starting gear. Make a choice where available.</p>
                        <div className="space-y-2 mt-1">
                            {selectedArchetype.equipment.map((item, index) => {
                                if (!item.includes(' or ')) {
                                    return <p key={index} className="bg-stone-900 p-2 rounded border border-stone-700">{item}</p>;
                                }
                                const options = item.split(' or ');
                                return (
                                    <div key={index} className="bg-stone-900 p-2 rounded border border-stone-700">
                                        <div className="flex items-center space-x-4">
                                            {options.map(option => (
                                                <label key={option} className="flex items-center space-x-2">
                                                    <input 
                                                        type="radio"
                                                        name={`equip-${index}`}
                                                        value={option}
                                                        checked={equipmentChoices[index] === option}
                                                        onChange={(e) => setEquipmentChoices(prev => ({...prev, [index]: e.target.value}))}
                                                        className="form-radio h-4 w-4 bg-stone-700 border-stone-600 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {step === 6 && (
            <div>
                <h3 className="font-cinzel text-3xl mb-6 text-center">Step 6: Generate Portrait</h3>
                <div className="space-y-4 max-w-lg mx-auto">
                    <div>
                        <label className="text-xl font-cinzel text-stone-300">Image Prompt</label>
                        <p className="text-sm text-stone-400 mb-2">An AI prompt has been generated based on your character. Feel free to edit it.</p>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full bg-stone-900 p-2 rounded border border-stone-600 mt-1" />
                    </div>
                    <button onClick={handleGeneratePortrait} disabled={generating} className="w-full font-cinzel text-xl bg-emerald-800 hover:bg-emerald-700 disabled:bg-stone-600 text-white font-bold py-3 px-8 rounded-lg">
                        {generating ? 'Generating...' : 'Generate Portrait'}
                    </button>
                    {generating && <div className="text-center text-stone-400">The Vaesen are stirring... please wait.</div>}
                    {generatedImage && (
                        <div className="mt-4 text-center">
                            <img src={generatedImage} alt="Generated character portrait" className="max-w-xs mx-auto rounded-lg border-2 border-stone-600" />
                            <div className="mt-4 flex justify-center space-x-4">
                                <button onClick={handleAcceptPortrait} className="font-cinzel bg-emerald-700 px-6 py-2 rounded-lg">Use This Portrait</button>
                                <button onClick={() => setGeneratedImage(null)} className="font-cinzel bg-stone-600 px-6 py-2 rounded-lg">Try Again</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {step === 7 && (
            <div>
                 <h3 className="font-cinzel text-3xl mb-6 text-center">Step 7: Finalize</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                    {portraitUrl && (
                        <div className="md:col-span-2 flex justify-center mb-4">
                            <img src={portraitUrl} alt="Character Portrait" className="w-48 h-auto rounded border-2 border-stone-600"/>
                        </div>
                    )}
                    <div className="md:col-span-2 bg-stone-900/50 p-4 rounded-lg">
                        <p><span className="font-bold font-cinzel text-stone-400">Name:</span> {name}</p>
                        <p><span className="font-bold font-cinzel text-stone-400">Archetype:</span> {archetypeName}</p>
                        <p><span className="font-bold font-cinzel text-stone-400">Age:</span> {age}</p>
                    </div>
                    <div><h4 className="font-cinzel text-xl text-stone-300">Attributes</h4>{Object.entries(attributes).map(([key, value]) => <p key={key}>{key}: {value}</p>)}</div>
                    <div><h4 className="font-cinzel text-xl text-stone-300">Skills</h4>{SKILLS_LIST.filter(s => skills[s.name] > 0).map(s => <p key={s.name}>{s.name}: {skills[s.name]}</p>)}</div>
                    <div><h4 className="font-cinzel text-xl text-stone-300">Background</h4><p>Motivation: {motivation}</p><p>Trauma: {trauma}</p><p>Secret: {darkSecret}</p></div>
                    <div><h4 className="font-cinzel text-xl text-stone-300">Talent</h4><p>{talent}</p></div>
                    <div className="md:col-span-2"><h4 className="font-cinzel text-xl text-stone-300">Equipment</h4><p>{selectedArchetype.equipment.map((item, index) => item.includes(' or ') ? equipmentChoices[index] : item).join(', ')}</p></div>
                    <div className="md:col-span-2"><h4 className="font-cinzel text-xl text-stone-300">Memento</h4><p>{memento}</p></div>
                 </div>
            </div>
        )}

      </div>
        <div className="flex justify-between mt-8">
            <button onClick={step === 1 ? onBack : prevStep} className="font-cinzel text-xl bg-stone-700/80 hover:bg-stone-600/80 text-white font-bold py-3 px-10 rounded-lg shadow-lg">
                Back
            </button>
            <button onClick={nextStep} className="font-cinzel text-2xl bg-emerald-800/80 hover:bg-emerald-700/80 text-white font-bold py-3 px-12 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                {step === 7 ? 'Begin Your Hunt' : 'Next'}
            </button>
        </div>
    </div>
  );
};

export default CharacterCreator;

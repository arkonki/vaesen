import React, { useState, useEffect } from 'react';
import { Headquarters, Upgrade, Character } from '../types';
import { UPGRADES } from '../constants';

interface HeadquartersManagerProps {
  hq: Headquarters | null;
  setHq: (hq: Headquarters) => void;
  character: Character;
}

const getIconForType = (type: Upgrade['type']) => {
    switch(type) {
        case 'Facility': return '🏰';
        case 'Contact': return '👤';
        case 'Personnel': return '👥';
        default: return '❓';
    }
}

const HeadquartersManager: React.FC<HeadquartersManagerProps> = ({ hq, setHq, character }) => {
  const [initializedHq, setInitializedHq] = useState<Headquarters | null>(hq);

  useEffect(() => {
    if (!hq) {
      const newHq: Headquarters = {
        name: 'Castle Gyllencreutz',
        developmentPoints: 0,
        upgrades: UPGRADES.map(u => u.purchased ? {...u} : {...u, purchased: false}) // Start with default purchased items
      };
      setInitializedHq(newHq);
      setHq(newHq);
    } else {
        setInitializedHq(hq);
    }
  }, [hq, setHq]);
  
  const isPrerequisiteMet = (prerequisite: string): boolean => {
    if (prerequisite === 'None' || prerequisite === 'Available from start') return true;

    const purchasedIds = initializedHq?.upgrades.filter(u => u.purchased).map(u => u.id) || [];
    
    if (prerequisite.includes('&')) {
        const parts = prerequisite.split('&').map(p => p.trim());
        return parts.every(part => isPrerequisiteMet(part));
    }
    if (prerequisite.includes('or')) {
        const parts = prerequisite.split('or').map(p => p.trim());
        return parts.some(part => isPrerequisiteMet(part));
    }
    
    if(prerequisite.startsWith('Resources')) {
        const level = parseInt(prerequisite.split(' ')[1]);
        return character.resources >= level;
    }

    if (prerequisite.toLowerCase().includes('doctor')) return character.archetype.name === 'Doctor';
    if (prerequisite.toLowerCase().includes('hunter')) return character.archetype.name === 'Hunter';
    if (prerequisite.toLowerCase().includes('occultist')) return character.archetype.name === 'Occultist';
    
    const requiredUpgrade = UPGRADES.find(u => u.name === prerequisite);
    return requiredUpgrade ? purchasedIds.includes(requiredUpgrade.id) : false;
  }


  if (!initializedHq) {
    return <div>Loading Headquarters...</div>;
  }
  
  const handleDpChange = (amount: number) => {
    const newDp = Math.max(0, initializedHq.developmentPoints + amount);
    setHq({...initializedHq, developmentPoints: newDp});
  }

  const handlePurchase = (upgradeToBuy: Upgrade) => {
    if (initializedHq.developmentPoints >= upgradeToBuy.cost) {
      const newDp = initializedHq.developmentPoints - upgradeToBuy.cost;
      const newUpgrades = initializedHq.upgrades.map(u => 
        u.id === upgradeToBuy.id ? {...u, purchased: true} : u
      );
      setHq({ ...initializedHq, developmentPoints: newDp, upgrades: newUpgrades });
    } else {
      alert("Not enough Development Points!");
    }
  };

  const availableUpgrades = initializedHq.upgrades.filter(u => {
    if (u.purchased) return false;
    if (u.name.includes('(Discovered)')) {
        return isPrerequisiteMet(u.prerequisite);
    }
    return true;
  });

  const purchasedUpgrades = initializedHq.upgrades.filter(u => u.purchased);

  return (
    <div className="space-y-6">
      <div className="bg-stone-900/60 p-4 rounded-lg border border-stone-700 shadow-lg flex justify-between items-center">
        <h2 className="text-3xl font-cinzel">{initializedHq.name}</h2>
        <div className="text-right">
            <div className="flex items-center justify-end">
              <span className="font-cinzel text-xl mr-2">Development Points: {initializedHq.developmentPoints}</span>
              <button onClick={() => handleDpChange(-1)} className="w-8 h-8 bg-stone-700 rounded">-</button>
              <button onClick={() => handleDpChange(1)} className="w-8 h-8 bg-stone-700 rounded ml-1">+</button>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-stone-900/60 p-4 rounded-lg border border-stone-700">
          <h3 className="font-cinzel text-2xl border-b-2 border-stone-600 pb-2 mb-3 text-emerald-300">Available Upgrades</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {availableUpgrades.map(upgrade => (
              <div key={upgrade.id} className={`bg-stone-800/50 p-3 rounded border ${upgrade.name.includes('(Discovered)') ? 'border-amber-500/50' : 'border-stone-700'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">{getIconForType(upgrade.type)} {upgrade.name.replace(' (Discovered)', '')}</h4>
                    <p className="text-stone-300 text-sm">{upgrade.description}</p>
                    <p className="text-xs text-stone-500 mt-1">Prerequisite: {upgrade.prerequisite}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">{upgrade.cost} DP</p>
                    <button 
                        onClick={() => handlePurchase(upgrade)}
                        disabled={!isPrerequisiteMet(upgrade.prerequisite)}
                        className="mt-1 px-3 py-1 bg-emerald-800 text-white text-sm rounded hover:bg-emerald-700 disabled:bg-stone-600 disabled:cursor-not-allowed"
                    >
                      {upgrade.name.includes('(Discovered)') ? 'Discover' : 'Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-stone-900/60 p-4 rounded-lg border border-stone-700">
          <h3 className="font-cinzel text-2xl border-b-2 border-stone-600 pb-2 mb-3 text-stone-200">Purchased Upgrades</h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {purchasedUpgrades.map(upgrade => (
              <div key={upgrade.id} className="bg-stone-800/50 p-3 rounded border border-stone-700">
                <h4 className="font-bold text-lg">{getIconForType(upgrade.type)} {upgrade.name.replace(' (Discovered)', '')}</h4>
                <p className="text-stone-300 text-sm">{upgrade.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default HeadquartersManager;
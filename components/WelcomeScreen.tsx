import React from 'react';
import { Campaign } from '../types';

interface WelcomeScreenProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
  onCreateNew: () => void;
  onDeleteCampaign: (campaignId: string) => void;
  onLogout: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ campaigns, onSelectCampaign, onCreateNew, onDeleteCampaign, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center fade-in">
      <h1 className="text-8xl font-cinzel text-stone-100 tracking-widest">VAESEN</h1>
      <p className="text-xl text-stone-400 mt-2 mb-12">Campaign Manager</p>
      
      <div className="w-full max-w-lg space-y-4">
        <button
          onClick={onCreateNew}
          className="w-full font-cinzel text-2xl bg-emerald-800/80 hover:bg-emerald-700/80 text-white font-bold py-4 px-12 rounded-lg shadow-lg transition-transform transform hover:scale-105"
        >
          Create New Investigator
        </button>
        
        {campaigns.length > 0 && (
          <div className="pt-4 space-y-3">
             <h2 className="font-cinzel text-2xl text-stone-300">Continue Your Hunt</h2>
            {campaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between bg-stone-800/50 p-3 rounded-lg border border-stone-700">
                <div>
                    <p className="font-bold text-lg text-left">{campaign.character_data.name}</p>
                    <p className="text-sm text-stone-400 text-left">{campaign.character_data.archetype.name}</p>
                </div>
                <div>
                    <button
                        onClick={() => onSelectCampaign(campaign)}
                        className="font-semibold bg-stone-700/80 hover:bg-stone-600/80 text-white py-2 px-4 rounded-lg shadow-lg"
                    >
                        Load
                    </button>
                    <button
                        onClick={() => onDeleteCampaign(campaign.id)}
                        className="ml-2 font-semibold bg-red-900/70 hover:bg-red-800/70 text-white py-2 px-4 rounded-lg"
                    >
                        Delete
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onLogout} className="mt-8 text-stone-400 hover:text-white hover:underline">Logout</button>
      </div>
    </div>
  );
};

export default WelcomeScreen;

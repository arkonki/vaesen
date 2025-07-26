
import React, { useState, useEffect } from 'react';
import { Campaign, CampaignCreationData, Character, Headquarters } from './types';
import CharacterCreator from './components/CharacterCreator';
import CharacterSheet from './components/CharacterSheet';
import DiceRoller from './components/DiceRoller';
import HeadquartersManager from './components/HeadquartersManager';
import WelcomeScreen from './components/WelcomeScreen';
import CampaignJournal from './components/CampaignJournal';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

type View = 'CHARACTER' | 'DICE_ROLLER' | 'HEADQUARTERS' | 'JOURNAL';
type AppState = 'AUTH' | 'WELCOME' | 'CREATING' | 'PLAYING';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeView, setActiveView] = useState<View>('CHARACTER');
  const [appState, setAppState] = useState<AppState>('AUTH');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = (error: any, userMessage: string) => {
    const detailedMessage = error?.message ? `: ${error.message}` : '';
    console.error(userMessage, error);
    setError(`${userMessage}${detailedMessage}`);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCampaigns(session.user.id);
        setAppState('WELCOME');
      } else {
        setAppState('AUTH');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       if (session) {
        fetchCampaigns(session.user.id);
        setAppState('WELCOME');
      } else {
        setAppState('AUTH');
        setCampaigns([]);
        setActiveCampaign(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCampaigns = async (userId: string) => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId);
    
    if (error) handleApiError(error, 'Could not fetch your campaigns.');
    else setCampaigns(data || []);
  };

  const handleCampaignCreated = async (newCampaignData: CampaignCreationData) => {
    if (!session?.user) {
        handleApiError(null, "Cannot create campaign without a user.");
        return;
    }
    const campaignToInsert = { ...newCampaignData, user_id: session.user.id };
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaignToInsert])
      .select()
      .single();

    if (error) {
      handleApiError(error, 'Error creating your campaign. Please try again.');
    } else if (data) {
      const newCampaign = data;
      setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
      setActiveCampaign(newCampaign);
      setAppState('PLAYING');
    }
  };

  const handleCampaignUpdate = async (updatedCampaign: Campaign) => {
    setActiveCampaign(updatedCampaign);
    const { id, character_data, headquarters_data, journal_data } = updatedCampaign;
    const updateData = {
        character_data,
        headquarters_data,
        journal_data,
    };
    const { error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id);

    if (error) handleApiError(error, 'Failed to save updates. Please check your connection.');
    else {
        setCampaigns(prevCampaigns => prevCampaigns.map(c => c.id === id ? updatedCampaign : c));
    }
  };
  
  const handleDeleteCampaign = async (campaignId: string) => {
      if (window.confirm('Are you sure you want to delete this character and campaign? This cannot be undone.')) {
          const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
          if (error) handleApiError(error, 'Failed to delete campaign.');
          else {
              const newCampaigns = campaigns.filter(c => c.id !== campaignId);
              setCampaigns(newCampaigns);
              if (activeCampaign?.id === campaignId) {
                  setActiveCampaign(null);
                  setAppState('WELCOME');
              }
          }
      }
  }

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) handleApiError(error, 'Failed to log out.');
      setActiveCampaign(null);
      setCampaigns([]);
      setAppState('AUTH');
  }

  const NavButton: React.FC<{ view: View, label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      disabled={!activeCampaign}
      className={`font-cinzel px-4 py-2 text-lg border-b-2 transition-colors duration-300 ${activeView === view ? 'text-stone-100 border-stone-100' : 'text-stone-400 border-transparent hover:text-stone-200 hover:border-stone-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );

  const ErrorBanner = () => {
    if (!error) return null;
    return (
      <div className="fixed top-5 right-5 bg-red-800 text-white p-4 rounded-lg shadow-lg flex items-center z-50 animate-pulse">
        <span>{error}</span>
        <button onClick={() => setError(null)} className="ml-4 font-bold text-xl">&times;</button>
      </div>
    );
  };


  const renderContent = () => {
    if (loading) return <div className="text-center text-2xl font-cinzel">Loading...</div>;

    switch (appState) {
      case 'AUTH':
        return <Auth />;
      case 'WELCOME':
        return <WelcomeScreen
          campaigns={campaigns}
          onSelectCampaign={(campaign) => { setActiveCampaign(campaign); setAppState('PLAYING'); }}
          onCreateNew={() => setAppState('CREATING')}
          onDeleteCampaign={handleDeleteCampaign}
          onLogout={handleLogout}
        />;
      case 'CREATING':
        return <CharacterCreator onCampaignCreated={handleCampaignCreated} onBack={() => setAppState('WELCOME')} />;
      case 'PLAYING':
        return (
          <>
            <header className="flex justify-between items-center mb-6 border-b border-stone-600 pb-4">
              <div className="flex items-center space-x-8">
                <h1 className="text-4xl font-bold font-cinzel text-stone-100 tracking-wider">VAESEN</h1>
                <nav className="flex space-x-2">
                  <NavButton view="CHARACTER" label="Character" />
                  <NavButton view="DICE_ROLLER" label="Dice Roller" />
                  <NavButton view="HEADQUARTERS" label="Headquarters" />
                  <NavButton view="JOURNAL" label="Journal" />
                </nav>
              </div>
              <div>
                <button onClick={() => {setActiveCampaign(null); setAppState('WELCOME')}} className="px-3 py-1 bg-stone-600/70 hover:bg-stone-500/70 text-white rounded-md transition-colors font-semibold text-sm mr-2">
                    Back to Campaigns
                </button>
                <button onClick={handleLogout} className="px-3 py-1 bg-red-800/70 hover:bg-red-700/70 text-white rounded-md transition-colors font-semibold text-sm">
                    Logout
                </button>
              </div>
            </header>
            <main className="fade-in" key={activeView}>
              {activeCampaign && (
                <>
                  {activeView === 'CHARACTER' && <CharacterSheet character={activeCampaign.character_data} onCharacterUpdate={(char) => handleCampaignUpdate({...activeCampaign, character_data: char})} />}
                  {activeView === 'DICE_ROLLER' && <DiceRoller character={activeCampaign.character_data} onCharacterUpdate={(char) => handleCampaignUpdate({...activeCampaign, character_data: char})} />}
                  {activeView === 'HEADQUARTERS' && <HeadquartersManager hq={activeCampaign.headquarters_data} setHq={(hq) => handleCampaignUpdate({...activeCampaign, headquarters_data: hq})} character={activeCampaign.character_data} />}
                  {activeView === 'JOURNAL' && <CampaignJournal content={activeCampaign.journal_data} onUpdate={(journal) => handleCampaignUpdate({...activeCampaign, journal_data: journal})} />}
                </>
              )}
            </main>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-800/80 text-stone-200 p-4 md:p-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <ErrorBanner />
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
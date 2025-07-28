export enum Attribute {
  Physique = 'Physique',
  Precision = 'Precision',
  Logic = 'Logic',
  Empathy = 'Empathy',
}

export enum Skill {
  Agility = 'Agility',
  CloseCombat = 'Close Combat',
  Force = 'Force',
  Medicine = 'Medicine',
  RangedCombat = 'Ranged Combat',
  Stealth = 'Stealth',
  Investigation = 'Investigation',
  Learning = 'Learning',
  Vigilance = 'Vigilance',
  Inspiration = 'Inspiration',
  Manipulation = 'Manipulation',
  Observation = 'Observation',
}

export enum AgeGroup {
  Young = 'Young',
  MiddleAged = 'Middle-aged',
  Old = 'Old',
}

export interface Archetype {
  name: string;
  description: string;
  mainAttribute: Attribute;
  mainSkill: Skill;
  talents: string[];
  equipment: string[];
  resources: [number, number];
  motivations: string[];
  traumas: string[];
  darkSecrets: string[];
  relationships: string[];
}

export interface Condition {
  name: string;
  type: 'physical' | 'mental';
  active: boolean;
}

export interface DefectInsight {
  name: string;
  description: string;
  type: 'physical' | 'mental';
}

export interface Character {
  name: string;
  archetype: Archetype;
  age: AgeGroup;
  attributes: Record<Attribute, number>;
  skills: Record<Skill, number>;
  talents: string[];
  motivation: string;
  trauma: string;
  darkSecret: string;
  relationships: { name: string; description: string }[];
  memento: string;
  equipment: string[];
  resources: number;
  conditions: Condition[];
  xp: number;
  defects: DefectInsight[];
  insights: DefectInsight[];
  portraitUrl: string;
}

export interface Upgrade {
  id: string;
  name: string;
  type: 'Facility' | 'Contact' | 'Personnel';
  prerequisite: string;
  cost: number;
  description: string;
  purchased: boolean;
}

export interface Headquarters {
  name: string;
  developmentPoints: number;
  upgrades: Upgrade[];
}

export interface Campaign {
  id: string;
  user_id: string;
  character_data: Character;
  headquarters_data: Headquarters;
  journal_data: string;
}

export interface CampaignCreationData {
  character_data: Character;
  headquarters_data: Headquarters;
  journal_data: string;
}

// Add this to fix import.meta.env errors
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

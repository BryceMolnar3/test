import { API_BASE_URL } from '../config.ts';

interface CollationResult {
  differences: {
    [verseNumber: string]: {
      witnesses: string[];
      table: any[][];
    };
  };
}

interface WordComparison {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResult {
  comparisonId: string;
  isSignificant: boolean;
  variationType: string;
  wordComparison: WordComparison;
  timestamp: string;
}

export const collationService = {
  async collateManuscripts(): Promise<CollationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/collate/`);
      if (!response.ok) {
        throw new Error('Failed to collate manuscripts');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error during collation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async saveComparison(data: {
    wordComparison: WordComparison;
    isSignificant: boolean;
    variationType: string;
  }): Promise<ComparisonResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comparisons/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save comparison');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Error saving comparison: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getVerses(manuscriptId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch verses');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching verses: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getVerse(manuscriptId: string, verseNumber: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/${verseNumber}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch verse');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching verse: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getPhylogeneticTree(format: 'base64' | 'newick' = 'base64'): Promise<{ tree_image?: string; newick_tree?: string; manuscript_count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_phylogenetic_tree/?format2=${format}`);
      if (!response.ok) {
        throw new Error('Failed to fetch phylogenetic tree');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching phylogenetic tree: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}; 
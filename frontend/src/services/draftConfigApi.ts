import { DraftConfigurationCreate, DraftConfigurationResponse } from '../types/draftConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const draftConfigApi = {
  async createDraftConfiguration(config: DraftConfigurationCreate): Promise<DraftConfigurationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/draft-config/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getDraftConfiguration(configId: string): Promise<DraftConfigurationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/draft-config/${configId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async listDraftConfigurations(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/draft-config/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};
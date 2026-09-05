import apiClient from './apiClient';

/**
 * Start a new research workflow
 * @param {string} query - Research question
 * @returns {Promise<Object>} Research response with all data
 */
export async function startResearch(query) {
  try {
    const response = await apiClient.post('/api/research', { query });
    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Failed to start research:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Research failed',
    };
  }
}

/**
 * Fetch knowledge graph for an entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object>} Graph neighbors data
 */
export async function fetchGraphNeighbors(entityId) {
  try {
    const response = await apiClient.get(`/graph/${entityId}`);
    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error(`Failed to fetch graph for entity ${entityId}:`, error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Graph fetch failed',
    };
  }
}

/**
 * Search for evidence
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export async function searchEvidence(query) {
  try {
    const response = await apiClient.get('/api/search', { params: { q: query } });
    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Failed to search evidence:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Search failed',
    };
  }
}

export default {
  startResearch,
  fetchGraphNeighbors,
  searchEvidence,
};

import axiosClient from '../api/axiosClient';

/**
 * SkillMatchService - Rule-based candidate-to-job matching calculations
 */
export const skillMatchService = {
  getSkillMatch: async (candidateId, jobId) => {
    const response = await axiosClient.get(`/skill-match?candidateId=${candidateId}&jobId=${jobId}`);
    return response.data;
  },

  compareSkills: async (candidateSkills, jobSkills) => {
    const response = await axiosClient.post('/skill-match/compare', { candidateSkills, jobSkills });
    return response.data;
  },
};

export default skillMatchService;

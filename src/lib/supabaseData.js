import { supabase, isSupabaseConfigured } from './supabaseClient';

const SUPABASE_EDGE_FUNCTION_URL = 'https://esbvwqjdabcmbqubfffi.supabase.co/functions/v1/skill-match';

/**
 * Normalizes a job row from Supabase to ensure compatibility with all frontend UI expectations
 */
export const normalizeJob = (job) => {
  if (!job) return null;
  return {
    ...job,
    companyName: job.company || job.company_name || 'TechCorp Solutions',
    employmentType: job.employment_type || job.job_type || 'FULL_TIME',
    salaryRange: job.salary_range || 'Competitive',
    experienceRequired: job.experience_required || job.experience || 'Fresher / 0-2 years',
    requiredSkills: job.required_skills || job.skills || [],
    postedDate: job.posted_date || (job.created_at ? job.created_at.split('T')[0] : '2026-09-20'),
  };
};

/**
 * Centralized Supabase Database Operations
 * All panels interact directly with PostgreSQL on Supabase in real-time.
 */
export const supabaseDb = {
  // ─── 1. JOBS ─────────────────────────────────────────────────────────────
  async getJobs() {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase getJobs error:', error);
      throw error;
    }
    return (data || []).map(normalizeJob);
  },

  async getJobById(jobId) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Supabase getJobById error:', error);
      throw error;
    }
    return normalizeJob(data);
  },

  async getJobsByRecruiter(recruiterId) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('jobs').select('*').order('id', { ascending: false });
    if (recruiterId) {
      query = query.eq('recruiter_id', String(recruiterId));
    }
    const { data, error } = await query;
    if (error) throw error;
    // If no jobs strictly by this recruiter id, return all jobs for seamless UI testing
    if (!data || data.length === 0) {
      return this.getJobs();
    }
    return (data || []).map(normalizeJob);
  },

  async createJob(jobData, recruiterId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const row = {
      recruiter_id: String(recruiterId || '2'),
      title: jobData.title,
      company: jobData.company || jobData.companyName || 'TechCorp Solutions',
      location: jobData.location,
      employment_type: jobData.employmentType || jobData.jobType || 'FULL_TIME',
      job_type: jobData.jobType || jobData.employmentType || 'FULL_TIME',
      salary_range: jobData.salaryRange,
      experience: jobData.experience || jobData.experienceRequired,
      experience_required: jobData.experienceRequired || jobData.experience,
      description: jobData.description,
      requirements: jobData.requirements,
      skills: Array.isArray(jobData.skills) ? jobData.skills : (jobData.requiredSkills || []),
      required_skills: Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills : (jobData.skills || []),
      active: true,
      status: 'OPEN',
      deadline: jobData.deadline || null,
      posted_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase.from('jobs').insert(row).select().single();
    if (error) throw error;
    return normalizeJob(data);
  },

  async updateJob(jobId, updates) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const updateData = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.salaryRange !== undefined) updateData.salary_range = updates.salaryRange;
    if (updates.experience !== undefined) updateData.experience = updates.experience;
    if (updates.experienceRequired !== undefined) updateData.experience_required = updates.experienceRequired;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.requirements !== undefined) updateData.requirements = updates.requirements;
    if (updates.skills !== undefined) updateData.skills = updates.skills;
    if (updates.requiredSkills !== undefined) updateData.required_skills = updates.requiredSkills;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;

    const { data, error } = await supabase.from('jobs').update(updateData).eq('id', jobId).select().single();
    if (error) throw error;
    return normalizeJob(data);
  },

  async toggleJobStatus(jobId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const job = await this.getJobById(jobId);
    const newActive = !job.active;
    const newStatus = newActive ? 'OPEN' : 'CLOSED';
    const { data, error } = await supabase
      .from('jobs')
      .update({ active: newActive, status: newStatus })
      .eq('id', jobId)
      .select()
      .single();
    if (error) throw error;
    return normalizeJob(data);
  },

  async deleteJob(jobId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) throw error;
    return { success: true };
  },

  // ─── 2. APPLICATIONS & 70% SKILL MATCH GATE ──────────────────────────────
  async applyForJob({ jobId, candidateId, candidateName, candidateEmail, coverLetter, resumeUrl }) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    // 1. Fetch Job
    const job = await this.getJobById(jobId);
    if (!job) throw new Error('Job not found');

    // 2. Fetch Candidate Profile Skills
    let candidateSkills = [];
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('skills')
      .eq('user_id', String(candidateId))
      .maybeSingle();

    if (profile?.skills && Array.isArray(profile.skills)) {
      candidateSkills = profile.skills;
    }

    // 3. Evaluate Match with Edge Function or internal algorithm
    const matchEvaluation = await this.evaluateSkillMatch(candidateSkills, job.requiredSkills || job.skills || []);

    if (!matchEvaluation.isEligible) {
      throw new Error(`Skill match is ${matchEvaluation.matchScore}%, which is below the mandatory 70% requirement. Please update your skills to apply.`);
    }

    // 4. Insert into applications
    const appRow = {
      candidate_id: String(candidateId),
      job_id: Number(jobId),
      job_title: job.title,
      company: job.companyName || job.company,
      candidate_name: candidateName || 'Candidate',
      candidate_email: candidateEmail || '',
      status: 'APPLIED',
      cover_letter: coverLetter || '',
      resume_url: resumeUrl || null,
      match_score: matchEvaluation.matchScore,
      matching_skills: matchEvaluation.matchingSkills,
      missing_skills: matchEvaluation.missingSkills,
      applied_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('applications')
      .upsert(appRow, { onConflict: 'candidate_id,job_id' })
      .select()
      .single();

    if (error) throw error;

    // 5. Create notification for candidate
    try {
      await supabase.from('notifications').insert({
        user_id: String(candidateId),
        type: 'APPLICATION_SUBMITTED',
        message: `Your application for "${job.title}" at ${job.companyName} was submitted successfully with a ${matchEvaluation.matchScore}% skill match!`,
      });
    } catch (notifErr) {
      console.warn('Notification creation note:', notifErr);
    }

    return data;
  },

  async getCandidateApplications(candidateId) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('candidate_id', String(candidateId))
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      job: normalizeJob(app.job),
    }));
  },

  async getAllApplications() {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      job: normalizeJob(app.job),
    }));
  },

  async updateApplicationStatus(appId, status) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId)
      .select()
      .single();

    if (error) throw error;

    // Notify candidate of status change
    if (data?.candidate_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: data.candidate_id,
          type: 'APPLICATION_STATUS_UPDATE',
          message: `Your application status for "${data.job_title}" was updated to: ${status}.`,
        });
      } catch (err) {
        console.warn('Status notification error:', err);
      }
    }

    return data;
  },

  // ─── 3. SKILL MATCH (Edge Function) ──────────────────────────────────────
  async evaluateSkillMatch(candidateSkills = [], requiredSkills = []) {
    try {
      // Call deployed Supabase Edge Function
      const res = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateSkills, requiredSkills }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (edgeErr) {
      console.warn('Edge function fallback:', edgeErr);
    }

    // Local fallback calculation if network fails
    const cNorm = (candidateSkills || []).map(s => (s || '').toLowerCase().trim());
    const rNorm = (requiredSkills || []).map(s => (s || '').trim());
    if (rNorm.length === 0) return { matchScore: 100, isEligible: true, matchingSkills: [], missingSkills: [] };

    const matching = [];
    const missing = [];
    for (const r of rNorm) {
      const rl = r.toLowerCase();
      if (cNorm.some(c => c === rl || c.includes(rl) || rl.includes(c))) {
        matching.push(r);
      } else {
        missing.push(r);
      }
    }
    const score = Math.round((matching.length / rNorm.length) * 100);
    return {
      matchScore: score,
      isEligible: score >= 70,
      matchingSkills: matching,
      missingSkills: missing,
      threshold: 70,
    };
  },

  // ─── 4. SAVED JOBS ───────────────────────────────────────────────────────
  async getSavedJobs(candidateId) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*, job:jobs(*)')
      .eq('candidate_id', String(candidateId))
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      job: normalizeJob(s.job),
    }));
  },

  async saveJob(candidateId, jobId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({
        candidate_id: String(candidateId),
        job_id: Number(jobId),
      }, { onConflict: 'candidate_id,job_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unsaveJob(candidateId, jobIdOrSavedId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .or(`id.eq.${jobIdOrSavedId},and(candidate_id.eq.${candidateId},job_id.eq.${jobIdOrSavedId})`);

    if (error) throw error;
    return { success: true };
  },

  // ─── 5. INTERVIEWS ───────────────────────────────────────────────────────
  async getInterviews(candidateId, role) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('interviews').select('*').order('created_at', { ascending: false });
    if (role === 'CANDIDATE' && candidateId) {
      query = query.eq('candidate_id', String(candidateId));
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async scheduleInterview(interviewData) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const row = {
      application_id: interviewData.applicationId || null,
      candidate_id: String(interviewData.candidateId),
      recruiter_id: String(interviewData.recruiterId || '2'),
      job_id: interviewData.jobId || null,
      date: interviewData.date,
      time: interviewData.time,
      type: interviewData.type || 'ONLINE',
      meeting_link: interviewData.meetingLink || 'https://meet.google.com/hsp-' + Date.now().toString().slice(-6),
      notes: interviewData.notes || '',
      status: 'SCHEDULED',
    };

    const { data, error } = await supabase.from('interviews').insert(row).select().single();
    if (error) throw error;

    // Notify candidate
    try {
      await supabase.from('notifications').insert({
        user_id: String(interviewData.candidateId),
        type: 'INTERVIEW_SCHEDULED',
        message: `Interview scheduled for ${interviewData.date} at ${interviewData.time}. Link: ${row.meeting_link}`,
      });
    } catch (e) {
      console.warn('Interview notification note:', e);
    }

    return data;
  },

  async updateInterviewStatus(interviewId, status) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─── 6. PROFILES ─────────────────────────────────────────────────────────
  async getCandidateProfile(userId) {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', String(userId))
      .maybeSingle();

    return data || {
      userId,
      headline: 'Full-Stack Developer',
      bio: 'Enthusiastic developer ready for impactful opportunities.',
      location: 'Mumbai, India',
      education: 'B.Tech CSE',
      experience: 'Fresher',
      skills: ['Java', 'Spring Boot', 'React', 'REST API', 'MySQL'],
    };
  },

  async updateCandidateProfile(userId, profile) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const row = {
      user_id: String(userId),
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      education: profile.education,
      experience: profile.experience,
      phone: profile.phone,
      skills: profile.skills || [],
      resume_url: profile.resumeUrl || profile.resume_url || null,
      github_url: profile.githubUrl || profile.github_url || null,
      linkedin_url: profile.linkedInUrl || profile.linkedin_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('candidate_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecruiterProfile(userId) {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase
      .from('recruiter_profiles')
      .select('*')
      .eq('user_id', String(userId))
      .maybeSingle();

    return data || {
      userId,
      company_name: 'TechCorp Solutions',
      designation: 'HR Director',
      phone: '+91-9876543210',
    };
  },

  async updateRecruiterProfile(userId, profile) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const row = {
      user_id: String(userId),
      company_name: profile.company_name || profile.companyName || 'TechCorp Solutions',
      designation: profile.designation,
      phone: profile.phone,
      website: profile.website,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('recruiter_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─── 7. NOTIFICATIONS ────────────────────────────────────────────────────
  async getUserNotifications(userId) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', String(userId))
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAllNotificationsRead(userId) {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', String(userId));

    if (error) throw error;
  },

  // ─── 8. ADMIN & USERS ────────────────────────────────────────────────────
  async getAllUsers() {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async toggleUserActive(userId, currentActive) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('users')
      .update({ active: !currentActive })
      .eq('id', String(userId))
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(userId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase.from('users').delete().eq('id', String(userId));
    if (error) throw error;
    return { success: true };
  },
};

export default supabaseDb;

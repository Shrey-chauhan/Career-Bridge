/**
 * Modular Eligibility Engine Service for CareerBridge
 * Evaluates student profiles against job eligibility criteria deterministically.
 */

const checkCgpa = (studentCgpa, minCgpa) => {
  if (minCgpa !== undefined && minCgpa > 0) {
    if (studentCgpa === undefined || studentCgpa === null || studentCgpa < minCgpa) {
      return `Minimum CGPA required is ${minCgpa}, but your CGPA is ${studentCgpa !== undefined ? studentCgpa : 'N/A'}`;
    }
  }
  return null;
};

const checkBacklogs = (studentBacklogs, maxBacklogs) => {
  if (maxBacklogs !== undefined && maxBacklogs >= 0) {
    const backlogs = studentBacklogs || 0;
    if (backlogs > maxBacklogs) {
      return `Maximum allowed backlogs is ${maxBacklogs}, but you currently have ${backlogs} active backlog(s)`;
    }
  }
  return null;
};

const BRANCH_SYNONYMS = {
  CSE: ['CSE', 'COMPUTER SCIENCE', 'COMPUTER SCIENCE & ENGINEERING', 'COMPUTER SCIENCE AND ENGINEERING', 'CS'],
  IT: ['IT', 'INFORMATION TECHNOLOGY'],
  ECE: ['ECE', 'ELECTRONICS & COMMUNICATION', 'ELECTRONICS AND COMMUNICATION ENGINEERING', 'ELECTRONICS & COMMUNICATION ENGINEERING', 'ELECTRONICS'],
  EEE: ['EEE', 'ELECTRICAL & ELECTRONICS', 'ELECTRICAL AND ELECTRONICS ENGINEERING', 'EE', 'ELECTRICAL ENGINEERING'],
  ME: ['ME', 'MECHANICAL', 'MECHANICAL ENGINEERING'],
  CE: ['CE', 'CIVIL', 'CIVIL ENGINEERING'],
};

const getBranchVariants = (branchStr) => {
  if (!branchStr) return [];
  const upper = branchStr.trim().toUpperCase();
  for (const variants of Object.values(BRANCH_SYNONYMS)) {
    if (variants.includes(upper)) {
      return variants;
    }
  }
  return [upper];
};

const checkBranch = (studentBranch, allowedBranches) => {
  if (Array.isArray(allowedBranches) && allowedBranches.length > 0) {
    if (!studentBranch) {
      return `Job is restricted to branches (${allowedBranches.join(', ')}), but your branch is not specified in your profile`;
    }
    const studentVariants = getBranchVariants(studentBranch);
    const normalizedAllowed = allowedBranches.map((b) => b.trim().toUpperCase());

    const isMatch = studentVariants.some((v) => normalizedAllowed.includes(v)) ||
      normalizedAllowed.some((b) => studentVariants.some((v) => b.includes(v) || v.includes(b)));

    if (!isMatch) {
      return `Eligible branches are [${allowedBranches.join(', ')}], but your branch is ${studentBranch}`;
    }
  }
  return null;
};

const checkGraduationYear = (studentGradYear, graduationYears) => {
  if (Array.isArray(graduationYears) && graduationYears.length > 0) {
    if (!studentGradYear || !graduationYears.includes(Number(studentGradYear))) {
      return `Eligible graduation years are [${graduationYears.join(', ')}], but your graduation year is ${studentGradYear || 'N/A'}`;
    }
  }
  return null;
};

const checkSkills = (studentSkills, requiredSkills) => {
  // Skills are descriptive profile tags; hard eligibility is determined by CGPA, Backlogs, Branch, and Graduation Year
  return null;
};

/**
 * Main evaluation function aggregating all rule checkers
 */
const evaluateEligibility = (studentProfile, job) => {
  if (!studentProfile) {
    return {
      eligible: false,
      reasons: ['Student profile not completed. Please complete your profile to verify eligibility.'],
    };
  }

  const eligibility = job.eligibility || {};
  const reasons = [];

  const cgpaErr = checkCgpa(studentProfile.cgpa, eligibility.minimumCgpa);
  if (cgpaErr) reasons.push(cgpaErr);

  const backlogErr = checkBacklogs(studentProfile.backlogs, eligibility.maximumBacklogs);
  if (backlogErr) reasons.push(backlogErr);

  const branchErr = checkBranch(studentProfile.branch, eligibility.allowedBranches);
  if (branchErr) reasons.push(branchErr);

  const gradYearErr = checkGraduationYear(studentProfile.graduationYear, eligibility.graduationYears);
  if (gradYearErr) reasons.push(gradYearErr);

  const skillErr = checkSkills(studentProfile.skills, eligibility.requiredSkills);
  if (skillErr) reasons.push(skillErr);

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

module.exports = {
  checkCgpa,
  checkBacklogs,
  checkBranch,
  checkGraduationYear,
  checkSkills,
  evaluateEligibility,
};

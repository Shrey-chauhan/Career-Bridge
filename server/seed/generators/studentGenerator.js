const { randomInt, randomFloat, randomItem, randomItems } = require('../utils/random');

const colleges = [
  'Tech Valley Institute of Engineering',
  'National Institute of Digital Technology',
  'Modern College of Engineering',
  'ABC Institute of Technology',
  'Shree Ganesh Institute of Technology',
  'Central College of Engineering',
];

const skillPool = [
  'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Java', 'Python',
  'C++', 'SQL', 'HTML', 'CSS', 'Git', 'GitHub', 'REST API', 'TypeScript',
  'Next.js', 'Tailwind CSS', 'Docker', 'AWS', 'Data Structures', 'Algorithms',
];

const projectTitles = [
  'Smart Placement Portal', 'E-Commerce Platform', 'Expense Tracker',
  'Online Learning Platform', 'Hospital Management System', 'Real-Time Chat Application',
  'Food Delivery Platform', 'Job Recommendation Portal', 'College Event Management System',
  'Task Management Application', 'AI Resume Parser', 'Cryptocurrency Tracker',
];

const certNames = [
  'MongoDB Developer Certification', 'JavaScript Algorithms Certification',
  'AWS Cloud Foundations', 'React Development Certification',
  'Python Programming Certification', 'Git and GitHub Certification',
];

function generateStudentProfiles(studentUsers) {
  // Pre-define exact distributions
  const branches = [
    ...Array(100).fill('Computer Science & Engineering'),
    ...Array(35).fill('Information Technology'),
    ...Array(35).fill('Electronics & Communication Engineering'),
    ...Array(20).fill('Electrical & Electronics Engineering'),
    ...Array(15).fill('Mechanical Engineering'),
    ...Array(10).fill('Civil Engineering'),
    ...Array(5).fill('Artificial Intelligence & Data Science'),
  ];

  const gradYears = [
    ...Array(170).fill(2026),
    ...Array(20).fill(2025),
    ...Array(30).fill(2027),
  ];

  const placementStatuses = [
    ...Array(150).fill('NOT_PLACED'),
    ...Array(55).fill('PLACED'),
    ...Array(15).fill('NOT_INTERESTED'),
  ];

  const students = [];
  const resumes = [];

  studentUsers.forEach((usr, idx) => {
    const studentId = usr._id;
    const branch = branches[idx % branches.length];
    const graduationYear = gradYears[idx % gradYears.length];
    const placementStatus = placementStatuses[idx % placementStatuses.length];

    // CGPA between 6.0 and 9.8
    const cgpa = randomFloat(6.0, 9.8, 2);
    const backlogs = idx % 10 === 0 ? randomInt(1, 3) : 0;
    const studentSkills = randomItems(skillPool, randomInt(3, 7));

    // Projects
    const projectCount = randomInt(1, 3);
    const projects = [];
    for (let p = 0; p < projectCount; p++) {
      const pTitle = projectTitles[(idx + p) % projectTitles.length];
      projects.push({
        title: pTitle,
        description: `Full-stack application built for ${pTitle.toLowerCase()} with modern tech stack.`,
        technologies: randomItems(studentSkills, Math.min(3, studentSkills.length)),
        projectUrl: `https://example.com/projects/demo-${idx}-${p}`,
        githubUrl: `https://github.com/example/student-project-${idx}-${p}`,
      });
    }

    // Certifications
    const certCount = randomInt(0, 2);
    const certifications = [];
    for (let c = 0; c < certCount; c++) {
      const cName = certNames[(idx + c) % certNames.length];
      certifications.push({
        name: cName,
        issuer: 'Coursera / Udemy Academy',
        issueDate: new Date(2024, randomInt(0, 11), randomInt(1, 28)),
        credentialUrl: `https://example.com/cert/credential-${idx}-${c}`,
      });
    }

    // Experience
    const experience = [];
    if (idx % 3 === 0) {
      experience.push({
        company: 'InnoTech Software Internships',
        position: 'Software Engineering Intern',
        startDate: new Date(2025, 4, 1),
        endDate: new Date(2025, 7, 1),
        description: 'Worked on REST API development and UI component optimization.',
      });
    }

    // Resume Document (~180 students get a Resume)
    if (idx < 180) {
      const fileName = `resume_student_${String(idx + 1).padStart(3, '0')}.pdf`;
      const secureUrl = `https://example.com/resumes/${fileName}`;
      const uploadedAt = new Date(2026, randomInt(0, 5), randomInt(1, 28));

      resumes.push({
        studentId,
        fileName,
        originalFileName: `${usr.name.replace(/\s+/g, '_')}_Resume.pdf`,
        fileType: 'application/pdf',
        fileSize: randomInt(120000, 480000),
        storageProvider: 'LOCAL',
        publicId: `resumes/local_${idx + 1}`,
        secureUrl,
        version: idx % 10 === 0 ? 2 : 1,
        isActive: true,
        uploadedAt,
      });
    }

    const completion = Math.min(100, 50 + (projects.length * 10) + (certifications.length * 10) + (idx < 180 ? 20 : 0));

    students.push({
      _id: studentId, // Reuse matching ID or generated ObjectId
      userId: usr._id,
      phone: `+91 98${randomInt(10000000, 99999999)}`,
      college: colleges[idx % colleges.length],
      degree: 'B.Tech',
      branch,
      graduationYear,
      cgpa,
      backlogs,
      skills: studentSkills,
      projects,
      certifications,
      experience,
      location: randomItem(['Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Mumbai', 'Chennai']),
      bio: `Enthusiastic ${branch} undergraduate student passionate about web development, data structures, and software engineering.`,
      linkedin: `https://linkedin.com/in/student-${idx + 1}`,
      github: `https://github.com/student-${idx + 1}`,
      portfolio: `https://student-${idx + 1}.example.com`,
      profileCompletion: completion,
      placementStatus,
    });
  });

  return { students, resumes };
}

module.exports = {
  generateStudentProfiles,
};

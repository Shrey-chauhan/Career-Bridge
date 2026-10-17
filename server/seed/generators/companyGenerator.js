const { randomItem, randomInt } = require('../utils/random');

const industries = [
  'Information Technology & Services',
  'Software Development',
  'Financial Technology & Banking',
  'Healthcare & Biotechnology',
  'E-Commerce & Digital Retail',
  'Cybersecurity & Cloud Computing',
  'Artificial Intelligence & Analytics',
];

const companySizes = ['11-50', '51-200', '201-500', '500+'];
const locations = ['Bangalore', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Mumbai', 'Chennai'];

function generateCompanies(companyUsers, companyNames) {
  const companies = [];

  companyUsers.forEach((usr, idx) => {
    const cName = companyNames[idx];
    const slug = cName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 22 VERIFIED, 2 PENDING, 1 REJECTED
    let verificationStatus = 'VERIFIED';
    if (idx === 22 || idx === 23) verificationStatus = 'PENDING';
    if (idx === 24) verificationStatus = 'REJECTED';

    companies.push({
      _id: usr._id, // Matching ObjectId
      userId: usr._id,
      companyName: cName,
      logo: `https://example.com/logos/${slug}.png`,
      description: `${cName} is a leading enterprise provider specializing in ${industries[idx % industries.length].toLowerCase()} solutions and innovation.`,
      industry: industries[idx % industries.length],
      website: `https://${slug}.example.com`,
      location: locations[idx % locations.length],
      companySize: companySizes[idx % companySizes.length],
      foundedYear: randomInt(2005, 2020),
      contactEmail: usr.email,
      contactPhone: `+91 80${randomInt(10000000, 99999999)}`,
      verificationStatus,
    });
  });

  return companies;
}

module.exports = {
  generateCompanies,
};

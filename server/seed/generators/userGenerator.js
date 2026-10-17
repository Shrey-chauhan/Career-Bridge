const bcrypt = require('bcryptjs');

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Ananya', 'Priya', 'Sneha', 'Neha', 'Kavya',
  'Dev', 'Ishaan', 'Ayaan', 'Kabir', 'Rudra', 'Diya', 'Isha', 'Riya', 'Aadhya', 'Sanya',
  'Manish', 'Vikram', 'Rajesh', 'Suresh', 'Amit', 'Pooja', 'Sunita', 'Kiran', 'Deepak', 'Sanjay',
  'Alok', 'Meera', 'Rani', 'Siddharth', 'Nikhil', 'Tanvi', 'Shreya', 'Varun', 'Yash', 'Gaurav',
  'Prateek', 'Kunal', 'Abhishek', 'Kartik', 'Rahul', 'Nisha', 'Swati', 'Preeti', 'Harsh', 'Tarun',
];

const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Tiwari', 'Gupta', 'Patel', 'Joshi', 'Mehta', 'Nair',
  'Kapoor', 'Malhotra', 'Reddy', 'Rao', 'Chowdhury', 'Mukherjee', 'Banerjee', 'Das', 'Sen', 'Dutta',
  'Bhat', 'Hegde', 'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Yadav', 'Mishra', 'Pandey', 'Tripathi',
  'Shukla', 'Saxena', 'Agarwal', 'Bansal', 'Goyal', 'Jain', 'Shah', 'Solanki', 'Chauhan', 'Rathore',
];

const companyNames = [
  'TechNova Solutions', 'CodeSphere Technologies', 'InnoStack Labs', 'CloudMatrix Systems',
  'ByteBridge Technologies', 'NextGen Digital', 'DataOrbit Solutions', 'DevCraft Technologies',
  'PixelPeak Labs', 'LogicWave Systems', 'AppVertex Technologies', 'NexaSoft Solutions',
  'CodeVista Labs', 'CloudForge Technologies', 'WebNest Systems', 'CyberEdge Networks',
  'ApexByte Innovations', 'Vanguard Software', 'InfiniTech Labs', 'Synapse Analytics',
  'QuantumCode Systems', 'StratoCloud Technologies', 'HyperLink Networks', 'OmniData Labs', 'Zenith Digital',
];

async function generateUsers() {
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const users = [];

  // 1. Generate 220 STUDENT users
  for (let i = 1; i <= 220; i++) {
    const fn = firstNames[(i - 1) % firstNames.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    const name = `${fn} ${ln}`;
    const padId = String(i).padStart(3, '0');
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${padId}@example.com`;

    users.push({
      name,
      email,
      password: passwordHash,
      role: 'STUDENT',
      isActive: true,
      isVerified: true,
    });
  }

  // 2. Generate 25 COMPANY users
  for (let i = 1; i <= 25; i++) {
    const cName = companyNames[i - 1];
    const slug = cName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `recruiter.${slug}@example.com`;

    users.push({
      name: `${cName} Recruiter`,
      email,
      password: passwordHash,
      role: 'COMPANY',
      isActive: true,
      isVerified: true,
    });
  }

  // 3. Generate 3 TPO users
  for (let i = 1; i <= 3; i++) {
    users.push({
      name: `TPO Officer ${i}`,
      email: `tpo${i}@careerbridge.example.com`,
      password: passwordHash,
      role: 'TPO',
      isActive: true,
      isVerified: true,
    });
  }

  // 4. Generate 2 ADMIN users
  for (let i = 1; i <= 2; i++) {
    users.push({
      name: `Placement Admin ${i}`,
      email: `admin${i}@careerbridge.example.com`,
      password: passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    });
  }

  return { users, companyNames };
}

module.exports = {
  generateUsers,
};

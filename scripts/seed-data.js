// Script to seed Firebase with mock data

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc 
} = require('firebase/firestore');

// Firebase config with actual values
const firebaseConfig = {
  apiKey: "AIzaSyC6nGs4LchGCfeWzk4h9hKwhP_PICt5_w4",
  authDomain: "taskflow-c8d26.firebaseapp.com",
  projectId: "taskflow-c8d26",
  storageBucket: "taskflow-c8d26.firebasestorage.app",
  messagingSenderId: "916956058649",
  appId: "1:916956058649:web:8eb26269e333b13feac688"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Mock clients data
const mockClients = [
  {
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    phone: '555-123-4567',
    hourlyRate: 150,
    activeTasks: 0,
    completedTasks: 0
  },
  {
    name: 'Globex Industries',
    email: 'info@globex.com',
    phone: '555-987-6543',
    monthlyWage: 5000,
    activeTasks: 0,
    completedTasks: 0
  },
  {
    name: 'Stark Enterprises',
    email: 'hello@stark.com',
    phone: '555-111-2222',
    hourlyRate: 200,
    activeTasks: 0,
    completedTasks: 0
  }
];

// Task titles
const taskTitles = [
  'Website redesign',
  'Mobile app development',
  'SEO optimization',
  'Content creation',
  'Logo design',
  'Social media campaign',
  'Database migration',
  'Security audit',
  'UI/UX improvements',
  'Performance optimization',
  'Create analytics dashboard',
  'API integration',
  'Email marketing setup',
  'Cloud migration',
  'Create documentation',
  'Setup CI/CD pipeline',
  'Implement authentication',
  'User testing',
  'A/B testing',
  'QA testing'
];

// Task descriptions
const taskDescriptions = [
  'Complete overhaul of the current website with modern design and improved user experience.',
  'Develop a cross-platform mobile application with offline capabilities.',
  'Optimize website content and structure for better search engine ranking.',
  'Create engaging content for blog posts, social media, and newsletters.',
  'Design a professional and modern logo that reflects brand identity.',
  'Plan and execute a comprehensive social media marketing campaign.',
  'Migrate existing database to a more scalable solution with minimal downtime.',
  'Perform a thorough security audit to identify and address vulnerabilities.',
  'Improve user interface and experience based on user feedback and analytics.',
  'Optimize application performance for faster load times and better responsiveness.',
  'Create a comprehensive analytics dashboard for tracking KPIs and business metrics.',
  'Integrate with third-party APIs to extend platform functionality.',
  'Set up automated email marketing campaigns for customer engagement.',
  'Migrate on-premise infrastructure to cloud-based solutions.',
  'Create comprehensive technical and user documentation.',
  'Set up continuous integration and deployment pipeline for streamlined development.',
  'Implement secure authentication and authorization system.',
  'Conduct user testing sessions to gather feedback on new features.',
  'Design and implement A/B tests to optimize conversion rates.',
  'Perform quality assurance testing to ensure application reliability.'
];

// Task statuses
const statuses = ['todo', 'in-progress', 'done'];

// Mock task generation function
function generateMockTasks(clientIds) {
  const tasks = [];
  const today = new Date();
  const pastMonth = new Date();
  pastMonth.setMonth(today.getMonth() - 1);
  
  const nextThreeMonths = new Date();
  nextThreeMonths.setMonth(today.getMonth() + 3);
  
  // Create 20 tasks distributed across clients
  for (let i = 0; i < 20; i++) {
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    
    // Distribute statuses with a bias toward active tasks
    let status;
    const statusRand = Math.random();
    if (statusRand < 0.4) {
      status = 'todo';
    } else if (statusRand < 0.7) {
      status = 'in-progress';
    } else {
      status = 'done';
    }
    
    // Generate more realistic due dates based on status
    let dueDate;
    if (status === 'done') {
      // Done tasks have due dates in the past or very recent
      dueDate = formatDate(randomDate(pastMonth, today));
    } else if (status === 'in-progress') {
      // In progress tasks have imminent or medium-term due dates
      const inProgressEnd = new Date();
      inProgressEnd.setDate(today.getDate() + 30);
      dueDate = formatDate(randomDate(today, inProgressEnd));
    } else {
      // Todo tasks have future due dates
      const todoStart = new Date();
      todoStart.setDate(today.getDate() + 7);
      dueDate = formatDate(randomDate(todoStart, nextThreeMonths));
    }
    
    // All tasks will have scheduling data
    let startTime, endTime, startDate, endDate;
    
    // Generate start/end times with a pattern that makes sense for the task status
    if (status === 'done') {
      // Done tasks have start and end dates in the past
      const startDateObj = randomDate(pastMonth, new Date(dueDate));
      startDate = formatDate(startDateObj);
      
      // For done tasks, ensure end date is before or on the due date
      const maxEndDate = new Date(Math.min(new Date(dueDate).getTime(), today.getTime()));
      const endDateObj = randomDate(startDateObj, maxEndDate);
      endDate = formatDate(endDateObj);
      
      // Business hours for start/end (8am - 6pm)
      startTime = `${8 + Math.floor(Math.random() * 4)}:${Math.random() > 0.5 ? '30' : '00'}`;
      endTime = `${14 + Math.floor(Math.random() * 4)}:${Math.random() > 0.5 ? '30' : '00'}`;
    } 
    else if (status === 'in-progress') {
      // In-progress tasks start in the past but end in the future
      const startDateObj = randomDate(pastMonth, today);
      startDate = formatDate(startDateObj);
      
      // End date is in the future but before the due date
      const endDateObj = randomDate(today, new Date(dueDate));
      endDate = formatDate(endDateObj);
      
      // Business hours
      startTime = `${8 + Math.floor(Math.random() * 3)}:${Math.random() > 0.5 ? '30' : '00'}`;
      endTime = `${15 + Math.floor(Math.random() * 3)}:${Math.random() > 0.5 ? '30' : '00'}`;
    }
    else {
      // Todo tasks are fully scheduled in the future
      const dueDateObj = new Date(dueDate);
      
      // Start date is between now and 3 days before due date
      const earliestStart = new Date();
      earliestStart.setDate(today.getDate() + 1);
      
      const latestStart = new Date(dueDateObj);
      latestStart.setDate(dueDateObj.getDate() - 3);
      
      // If latest start is before earliest start, use earliest start
      const startDateObj = randomDate(
        earliestStart, 
        latestStart > earliestStart ? latestStart : earliestStart
      );
      startDate = formatDate(startDateObj);
      
      // End date is between start date and due date
      const endDateObj = randomDate(startDateObj, dueDateObj);
      endDate = formatDate(endDateObj);
      
      // Business hours - earlier in the day for start times
      startTime = `${8 + Math.floor(Math.random() * 2)}:${Math.random() > 0.5 ? '30' : '00'}`;
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = Math.min(startHour + 2 + Math.floor(Math.random() * 6), 18);
      endTime = `${endHour}:${Math.random() > 0.5 ? '30' : '00'}`;
    }
    
    // Ensure estimated duration makes sense with start/end times
    // Calculate approximate duration in minutes from start to end times
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    let durationHours = endParts[0] - startParts[0];
    let durationMinutes = endParts[1] - startParts[1];
    
    if (durationMinutes < 0) {
      durationMinutes += 60;
      durationHours -= 1;
    }
    
    // Multiply by number of days if multi-day task
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const daysDiff = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    
    // Estimated duration in minutes - factor in multi-day tasks
    const estimatedDuration = Math.max(
      30,
      Math.min(
        Math.floor(((durationHours * 60 + durationMinutes) * daysDiff) * 0.8), // 80% of the total time
        480 // Max 8 hours
      )
    );
    
    tasks.push({
      clientId,
      title: taskTitles[i % taskTitles.length],
      description: taskDescriptions[i % taskDescriptions.length],
      estimatedDuration,
      dueDate,
      status,
      startTime,
      endTime,
      startDate,
      endDate
    });
  }
  
  return tasks;
}

// Seed the database
async function seedDatabase() {
  try {
    console.log('Starting to seed the database...');
    
    // Add clients first
    const clientIds = [];
    for (const client of mockClients) {
      const clientWithTimestamp = {
        ...client,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'clients'), clientWithTimestamp);
      clientIds.push(docRef.id);
      console.log(`Added client: ${client.name} with ID: ${docRef.id}`);
    }
    
    // Generate tasks based on the client IDs
    const tasks = generateMockTasks(clientIds);
    
    // Track task counts per client
    const clientTaskCounts = {};
    clientIds.forEach(id => {
      clientTaskCounts[id] = { active: 0, completed: 0 };
    });
    
    // Add tasks
    for (const task of tasks) {
      const taskWithTimestamp = {
        ...task,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), taskWithTimestamp);
      console.log(`Added task: ${task.title} with ID: ${docRef.id}`);
      
      // Increment the client's task count
      if (task.status === 'done') {
        clientTaskCounts[task.clientId].completed += 1;
      } else {
        clientTaskCounts[task.clientId].active += 1;
      }
    }
    
    // Update client task counts
    for (const clientId in clientTaskCounts) {
      const { active, completed } = clientTaskCounts[clientId];
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        activeTasks: active,
        completedTasks: completed
      });
      console.log(`Updated task counts for client ${clientId}: active=${active}, completed=${completed}`);
    }
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase(); 
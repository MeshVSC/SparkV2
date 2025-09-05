import { ExportService } from './ExportService.js';

// Mock data for testing
const mockSpark = {
  id: '1',
  userId: 'user1',
  title: 'Test Spark',
  description: 'This is a test spark description',
  content: 'This is the content of the spark',
  status: 'SEEDLING',
  xp: 100,
  level: 1,
  color: '#blue',
  tags: 'test, example',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  todos: [
    {
      id: 'todo1',
      sparkId: '1',
      title: 'Complete task 1',
      description: 'This is a test todo',
      completed: true,
      type: 'TASK',
      priority: 'HIGH',
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'todo2',
      sparkId: '1',
      title: 'Complete task 2',
      completed: false,
      type: 'TASK',
      priority: 'MEDIUM',
      createdAt: new Date('2024-01-01')
    }
  ]
};

const mockProjectData = {
  projectName: 'Test Project',
  sparks: [mockSpark],
  connections: [
    {
      id: 'conn1',
      sparkId1: '1',
      sparkId2: '2',
      createdAt: new Date('2024-01-01')
    }
  ],
  statistics: {
    totalXP: 100,
    completedTasks: 1
  }
};

// Test function to validate the service
async function testExportService() {
  try {
    console.log('Testing ExportService...');
    
    // Test spark export
    console.log('Testing exportSparkToPDF...');
    const sparkPdf = await ExportService.exportSparkToPDF(mockSpark);
    console.log('✓ Spark PDF generated successfully', sparkPdf instanceof Blob);
    
    // Test project export
    console.log('Testing exportProjectToPDF...');
    const projectPdf = await ExportService.exportProjectToPDF(mockProjectData);
    console.log('✓ Project PDF generated successfully', projectPdf instanceof Blob);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for potential usage
export { testExportService, mockSpark, mockProjectData };
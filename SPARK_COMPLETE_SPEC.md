# Spark - Complete Development Specification

## Project Overview
Spark is a visual idea evolution platform that nurtures concepts from initial inspiration to completion. Unlike traditional task managers, Spark focuses on organic growth of ideas through gamified, visual interaction with AI integration.

## Core Philosophy
- **Spark Evolution**: Ideas grow naturally from concept to reality
- **Visual First**: Everything is drag-and-drop, visual, interactive
- **Gamified Growth**: Progress feels rewarding and engaging
- **AI Partnership**: Claude integration for idea collaboration
- **Progressive Complexity**: Start simple, grow sophisticated as needed

## Technical Stack Recommendation
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Real-time**: Socket.io for live updates
- **File Storage**: AWS S3 or similar for attachments
- **Search**: ElasticSearch or PostgreSQL full-text search
- **MCP Integration**: Custom MCP server for Claude connectivity

## Core Data Models

### Spark Model
```typescript
interface Spark {
  id: string
  title: string
  description: string
  content: string // Rich markdown content
  status: 'seedling' | 'sapling' | 'tree' | 'forest'
  xp: number
  level: number
  createdAt: Date
  updatedAt: Date
  position: { x: number, y: number } // For visual positioning
  color: string
  tags: string[]
  attachments: Attachment[]
  todos: Todo[]
  connections: string[] // Connected spark IDs
}
```

### Todo Model
```typescript
interface Todo {
  id: string
  sparkId: string
  title: string
  description?: string
  completed: boolean
  type: 'general' | 'task'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  completedAt?: Date
  position?: { x: number, y: number }
}
```

### Attachment Model
```typescript
interface Attachment {
  id: string
  sparkId: string
  filename: string
  url: string
  type: 'image' | 'file' | 'link'
  size: number
  createdAt: Date
}
```

### Achievement Model
```typescript
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  unlockedAt?: Date
  type: 'milestone' | 'streak' | 'collection'
}
```

## Frontend Components Architecture

### Main Layout Components
1. **SparkCanvas** - Main visual workspace with drag-drop
2. **SparkCard** - Individual spark representation
3. **KanbanBoard** - Board view with columns
4. **IdeaBoard** - Visual mood board layout
5. **SearchBar** - Global search with instant results
6. **TimelineView** - Evolution/progress timeline
7. **GamificationPanel** - XP, levels, achievements display
8. **RichEditor** - Markdown editor component
9. **FileUploader** - Drag-drop file handling
10. **TodoList** - Nested todo management

### Core Views
1. **Dashboard** - Overview of all sparks with search
2. **Canvas View** - Freeform visual workspace
3. **Kanban View** - Board-based workflow
4. **Timeline View** - Chronological spark evolution
5. **Gallery View** - Visual/image-focused layout
6. **Achievement Center** - Gamification hub

## Key Features Implementation

### 1. Visual Drag & Drop System
```typescript
// React DnD or similar library
const SparkCanvas = () => {
  const handleDrop = (item: any, position: Position) => {
    // Handle external files, images, or internal spark movement
    if (item.type === 'external-file') {
      createAttachment(item.file, position)
    } else if (item.type === 'spark') {
      updateSparkPosition(item.id, position)
    }
  }
  
  return (
    <DropZone onDrop={handleDrop}>
      {sparks.map(spark => (
        <DraggableSpark key={spark.id} spark={spark} />
      ))}
    </DropZone>
  )
}
```

### 2. Gamification System
```typescript
const GamificationEngine = {
  calculateXP: (action: string, spark: Spark) => {
    const xpValues = {
      'create_spark': 10,
      'add_description': 15,
      'complete_todo': 20,
      'add_attachment': 5,
      'connect_sparks': 25
    }
    return xpValues[action] || 0
  },
  
  levelUp: (currentXP: number) => {
    return Math.floor(currentXP / 100) + 1
  },
  
  checkAchievements: (user: User, action: string) => {
    // Achievement logic here
  }
}
```

### 3. Search & Discovery
```typescript
const SearchEngine = {
  indexContent: (spark: Spark) => {
    // Full-text indexing of title, description, content, tags
    return {
      id: spark.id,
      searchableText: `${spark.title} ${spark.description} ${spark.content} ${spark.tags.join(' ')}`,
      metadata: { level: spark.level, status: spark.status }
    }
  },
  
  search: (query: string, filters?: SearchFilters) => {
    // Fuzzy search with ranking
    // Return relevant sparks sorted by relevance + recency + level
  }
}
```

### 4. Rich Content Editor
```typescript
// Use libraries like TipTap or similar
const RichEditor = ({ content, onChange }: EditorProps) => {
  return (
    <Editor
      content={content}
      onUpdate={({ editor }) => onChange(editor.getHTML())}
      extensions={[
        StarterKit,
        Image,
        Link,
        TaskList,
        TaskItem
      ]}
    />
  )
}
```

## Gamification Features Implementation

### XP System
- **Create Spark**: 10 XP
- **Add Description**: 15 XP
- **Complete Todo**: 20 XP
- **Add Attachment**: 5 XP
- **Connect Sparks**: 25 XP
- **Daily Login**: 5 XP
- **Complete Daily Challenge**: 50 XP

### Achievement Categories
1. **Creator Achievements**
   - "First Spark" - Create your first idea
   - "Idea Factory" - Create 10 sparks
   - "Visionary" - Create 100 sparks

2. **Progress Achievements**
   - "Seedling Gardener" - Grow 5 sparks to sapling
   - "Forest Maker" - Grow a spark to forest level
   - "Evolution Master" - Complete full spark lifecycle

3. **Streak Achievements**
   - "Daily Thinker" - 7 day login streak
   - "Consistency King" - 30 day streak
   - "Unstoppable" - 100 day streak

4. **Organization Achievements**
   - "Connector" - Link 10 sparks together
   - "Board Master" - Create 5 different boards
   - "Archive Keeper" - Organize 50 completed sparks

### Visual Celebrations
```typescript
const CelebrationSystem = {
  triggerCelebration: (type: 'levelUp' | 'achievement' | 'sparkComplete') => {
    // Particle effects, animations, sound (if enabled)
    // Confetti.js or similar for visual celebrations
  },
  
  sparkEvolutionAnimation: (oldLevel: string, newLevel: string) => {
    // Animate spark growing from seedling → sapling → tree → forest
    // Use Lottie animations or CSS animations
  }
}
```

## MCP Server Integration

### Spark MCP Server
```typescript
// MCP Server for Claude integration
class SparkMCPServer {
  async readSparks(query?: string): Promise<Spark[]> {
    // Return sparks matching query or all sparks
  }
  
  async createSpark(title: string, description?: string): Promise<Spark> {
    // Create new spark with Claude's input
  }
  
  async updateSpark(id: string, updates: Partial<Spark>): Promise<Spark> {
    // Update existing spark
  }
  
  async addTodo(sparkId: string, todo: string): Promise<Todo> {
    // Add todo to specific spark
  }
  
  async searchSparks(query: string): Promise<Spark[]> {
    // Semantic search through spark content
  }
  
  async connectSparks(sparkId1: string, sparkId2: string): Promise<void> {
    // Create connection between sparks
  }
  
  async getSuggestions(sparkId: string): Promise<string[]> {
    // AI-powered suggestions for spark evolution
  }
}
```

## UI/UX Design Specifications

### Visual Design System
- **Color Palette**: Warm, organic colors (greens, browns, golds for growth theme)
- **Typography**: Clean, readable sans-serif (Inter, Poppins)
- **Icons**: Consistent icon library (Lucide, Heroicons)
- **Animations**: Smooth, organic transitions (Framer Motion)

### Responsive Layout
- **Desktop**: Full canvas with sidebar panels
- **Tablet**: Condensed sidebar, touch-optimized controls
- **Mobile**: Stack-based navigation, swipe gestures

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Clear focus indicators

## Database Schema

```sql
-- Core Tables
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  status VARCHAR(50) DEFAULT 'seedling',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  position_x FLOAT,
  position_y FLOAT,
  color VARCHAR(7) DEFAULT '#10b981',
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id UUID REFERENCES sparks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  type VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(50) DEFAULT 'medium',
  position_x FLOAT,
  position_y FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id UUID REFERENCES sparks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spark_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id_1 UUID REFERENCES sparks(id) ON DELETE CASCADE,
  spark_id_2 UUID REFERENCES sparks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(spark_id_1, spark_id_2)
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX idx_sparks_user_id ON sparks(user_id);
CREATE INDEX idx_sparks_status ON sparks(status);
CREATE INDEX idx_sparks_updated_at ON sparks(updated_at);
CREATE INDEX idx_todos_spark_id ON todos(spark_id);
CREATE INDEX idx_attachments_spark_id ON attachments(spark_id);
```

## API Endpoints

### Spark Management
```typescript
// REST API endpoints
GET /api/sparks - List all sparks with pagination
POST /api/sparks - Create new spark
GET /api/sparks/:id - Get specific spark
PUT /api/sparks/:id - Update spark
DELETE /api/sparks/:id - Delete spark
POST /api/sparks/:id/todos - Add todo to spark
PUT /api/sparks/:id/position - Update spark position
POST /api/sparks/connect - Connect two sparks

// Search & Discovery
GET /api/search?q=query - Search sparks
GET /api/sparks/:id/suggestions - Get AI suggestions

// File Management
POST /api/sparks/:id/attachments - Upload attachment
DELETE /api/attachments/:id - Delete attachment

// Gamification
GET /api/user/stats - Get user XP, level, achievements
POST /api/user/achievements/:id/unlock - Unlock achievement
GET /api/user/leaderboard - Community features (optional)
```

## Implementation Priority

### Phase 1: Core MVP 
1. Basic spark CRUD operations
2. Simple drag & drop positioning
3. Todo management
4. Basic search functionality
5. File attachments
6. Simple gamification (XP only)

### Phase 2: Enhanced Features 
1. Rich text editor integration
2. Kanban board view
3. Achievement system
4. Visual celebrations
5. Timeline view
6. Advanced search with filters

### Phase 3: AI Integration 
1. MCP server implementation
2. Claude integration for suggestions
3. Semantic search capabilities
4. AI-powered connections

### Phase 4: Polish & Advanced Features 
1. Advanced animations
2. Mobile responsive design
3. Export/import functionality
4. Collaboration features (optional)
5. Performance optimizations

## Development Commands

```bash
# Setup
npx create-react-app spark --template typescript
cd spark
npm install @types/node @types/react @types/react-dom

# Core dependencies
npm install react-dnd react-dnd-html5-backend
npm install @tiptap/react @tiptap/starter-kit
npm install framer-motion lucide-react
npm install socket.io-client axios
npm install tailwindcss

# Backend setup
mkdir server && cd server
npm init -y
npm install express cors helmet morgan
npm install socket.io pg uuid
npm install @types/express @types/cors @types/pg
```

## Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user workflows
- **Performance Tests**: Lighthouse for web vitals
- **Accessibility Tests**: axe-core integration

## Deployment Strategy
- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: PostgreSQL (managed service)
- **File Storage**: AWS S3 or similar
- **Monitoring**: Sentry for error tracking

This specification provides a complete blueprint for building Spark with all requested features, gamification, AI integration, and a clear development roadmap.

# Spark MCP Server

This MCP (Model Context Protocol) server provides read/write access to the Spark application, allowing Claude Code to interact with your sparks, todos, achievements, and more.

## Features

### 🌟 Spark Management
- **Read Sparks**: Get all sparks or search by query
- **Create Sparks**: Create new sparks with title, description, content, status, color, and tags
- **Update Sparks**: Modify existing sparks
- **Delete Sparks**: Remove sparks

### ✅ Todo Management
- **Read Todos**: Get todos for a specific spark
- **Add Todos**: Create new todos with title, description, priority, and type
- **Update Todos**: Modify existing todos, including completion status
- **Delete Todos**: Remove todos

### 🏆 Achievement System
- **Get Achievements**: Retrieve all achievements and unlock status
- **Unlock Achievements**: Programmatically unlock achievements
- **User Progress**: Get user statistics and progress

### 🤖 AI-Powered Suggestions
- **Get Suggestions**: Receive AI-powered suggestions for spark evolution based on current status and content

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Configuration

Add the following to your Claude Code configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spark": {
      "command": "node",
      "args": ["/path/to/spark/mcp-server/spark-mcp-server.js"],
      "env": {
        "DATABASE_URL": "file:./dev.db"
      }
    }
  }
}
```

## Usage Examples

### Reading Sparks
```javascript
// Get all sparks
const sparks = await mcp.callTool("read_sparks", {})

// Search sparks
const searchResults = await mcp.callTool("read_sparks", { 
  query: "project management" 
})
```

### Creating a Spark
```javascript
const newSpark = await mcp.callTool("create_spark", {
  title: "My New Project",
  description: "A new project idea",
  content: "Detailed project description...",
  status: "SEEDLING",
  color: "#10b981",
  tags: "project,idea,new"
})
```

### Adding Todos
```javascript
const todo = await mcp.callTool("add_todo", {
  sparkId: "spark-id-here",
  title: "Research competitors",
  description: "Analyze competitor products and features",
  priority: "HIGH",
  type: "TASK"
})
```

### Getting Suggestions
```javascript
const suggestions = await mcp.callTool("get_suggestions", {
  sparkId: "spark-id-here"
})
```

### Managing Achievements
```javascript
// Get all achievements
const achievements = await mcp.callTool("get_achievements", {})

// Unlock an achievement
const result = await mcp.callTool("unlock_achievement", {
  achievementId: "first-spark"
})

// Get user progress
const progress = await mcp.callTool("get_user_progress", {})
```

## API Reference

### Tools

#### `read_sparks`
- **Description**: Read all sparks or search sparks by query
- **Parameters**: 
  - `query` (optional): Search query to filter sparks
- **Returns**: Array of spark objects

#### `create_spark`
- **Description**: Create a new spark
- **Parameters**:
  - `title` (required): Title of the spark
  - `description` (optional): Description of the spark
  - `content` (optional): Detailed content of the spark
  - `status` (optional): Status of the spark (SEEDLING, SAPLING, TREE, FOREST)
  - `color` (optional): Color code for the spark
  - `tags` (optional): Comma-separated tags for the spark
- **Returns**: Created spark object

#### `update_spark`
- **Description**: Update an existing spark
- **Parameters**:
  - `id` (required): ID of the spark to update
  - `title` (optional): New title of the spark
  - `description` (optional): New description of the spark
  - `content` (optional): New content of the spark
  - `status` (optional): New status of the spark
  - `color` (optional): New color code for the spark
  - `tags` (optional): New comma-separated tags for the spark
- **Returns**: Updated spark object

#### `delete_spark`
- **Description**: Delete a spark
- **Parameters**:
  - `id` (required): ID of the spark to delete
- **Returns**: Success confirmation

#### `add_todo`
- **Description**: Add a todo to a spark
- **Parameters**:
  - `sparkId` (required): ID of the spark
  - `title` (required): Title of the todo
  - `description` (optional): Description of the todo
  - `priority` (optional): Priority of the todo (LOW, MEDIUM, HIGH)
  - `type` (optional): Type of the todo (GENERAL, TASK)
- **Returns**: Created todo object

#### `update_todo`
- **Description**: Update a todo
- **Parameters**:
  - `sparkId` (required): ID of the spark containing the todo
  - `todoId` (required): ID of the todo to update
  - `title` (optional): New title of the todo
  - `description` (optional): New description of the todo
  - `completed` (optional): Whether the todo is completed
  - `priority` (optional): New priority of the todo
- **Returns**: Updated todo object

#### `delete_todo`
- **Description**: Delete a todo
- **Parameters**:
  - `sparkId` (required): ID of the spark containing the todo
  - `todoId` (required): ID of the todo to delete
- **Returns**: Success confirmation

#### `get_suggestions`
- **Description**: Get AI-powered suggestions for spark evolution
- **Parameters**:
  - `sparkId` (required): ID of the spark
- **Returns**: Object containing suggestions array

#### `get_achievements`
- **Description**: Get all achievements and unlock status
- **Parameters**: None
- **Returns**: Array of achievement objects with unlock status

#### `unlock_achievement`
- **Description**: Unlock an achievement
- **Parameters**:
  - `achievementId` (required): ID of the achievement to unlock
- **Returns**: Unlock result with XP awarded

#### `get_user_progress`
- **Description**: Get user progress and statistics
- **Parameters**: None
- **Returns**: User progress object with statistics

## Error Handling

All tool calls return standardized error responses:

```javascript
{
  "content": [
    {
      "type": "text",
      "text": JSON.stringify({ error: "Error message" }, null, 2)
    }
  ],
  "isError": true
}
```

## Development

The MCP server communicates with the main Spark application via HTTP requests. Ensure the main application is running on `http://localhost:3000` when using the MCP server.

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Security

- The MCP server communicates with the main application over HTTP
- Ensure proper authentication and authorization in production
- Validate all input parameters
- Handle errors gracefully

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Spark application and follows the same license terms.
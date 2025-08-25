export interface Spark {
  id: string
  userId: string
  title: string
  description?: string
  content?: string
  status: SparkStatus
  xp: number
  level: number
  positionX?: number
  positionY?: number
  color: string
  tags?: string
  createdAt: Date
  updatedAt: Date
  todos?: Todo[]
  attachments?: Attachment[]
  connections?: SparkConnection[]
}

export interface CreateSparkData {
  title: string
  description?: string
  content?: string
  status: SparkStatus
  xp: number
  level: number
  positionX?: number
  positionY?: number
  color: string
  tags?: string
}

export interface Todo {
  id: string
  sparkId: string
  title: string
  description?: string
  completed: boolean
  type: TodoType
  priority: TodoPriority
  positionX?: number
  positionY?: number
  createdAt: Date
  completedAt?: Date
}

export interface Attachment {
  id: string
  sparkId: string
  filename: string
  url: string
  type: AttachmentType
  size?: number
  createdAt: Date
}

export interface SparkConnection {
  id: string
  sparkId1: string
  sparkId2: string
  createdAt: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  type: AchievementType
  createdAt: Date
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
}

export enum SparkStatus {
  SEEDLING = "SEEDLING",
  SAPLING = "SAPLING",
  TREE = "TREE",
  FOREST = "FOREST"
}

export enum TodoType {
  GENERAL = "GENERAL",
  TASK = "TASK"
}

export enum TodoPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum AttachmentType {
  IMAGE = "IMAGE",
  FILE = "FILE",
  LINK = "LINK"
}

export enum AchievementType {
  MILESTONE = "MILESTONE",
  STREAK = "STREAK",
  COLLECTION = "COLLECTION"
}

export interface Position {
  x: number
  y: number
}
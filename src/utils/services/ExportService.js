import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class ExportService {
  /**
   * Export a spark to PDF format
   * @param {Object} spark - The spark object to export
   * @returns {Promise<Blob>} - Promise resolving to PDF blob
   */
  static async exportSparkToPDF(spark) {
    try {
      const pdf = new jsPDF();
      const margin = 20;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(spark.title || "Untitled Spark", margin, yPosition);
      yPosition += 15;

      // Add status and level
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Status: ${spark.status} | Level: ${spark.level} | XP: ${spark.xp}`, margin, yPosition);
      yPosition += 10;

      // Add tags if available
      if (spark.tags) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text(`Tags: ${spark.tags}`, margin, yPosition);
        yPosition += 10;
      }

      yPosition += 5;

      // Add description
      if (spark.description) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Description:", margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const descriptionLines = pdf.splitTextToSize(spark.description, pdf.internal.pageSize.width - 2 * margin);
        pdf.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 5 + 10;
      }

      // Add content if available
      if (spark.content) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Content:", margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const contentLines = pdf.splitTextToSize(spark.content, pdf.internal.pageSize.width - 2 * margin);
        pdf.text(contentLines, margin, yPosition);
        yPosition += contentLines.length * 5 + 10;
      }

      // Add todos if available
      if (spark.todos && spark.todos.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Tasks:", margin, yPosition);
        yPosition += 8;

        spark.todos.forEach((todo, index) => {
          // Check if we need a new page
          if (yPosition > pdf.internal.pageSize.height - 30) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const checkbox = todo.completed ? '☑' : '☐';
          const todoText = `${checkbox} ${todo.title}`;
          pdf.text(todoText, margin + 5, yPosition);
          yPosition += 6;

          if (todo.description) {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "italic");
            const todoDescLines = pdf.splitTextToSize(todo.description, pdf.internal.pageSize.width - 2 * margin - 10);
            pdf.text(todoDescLines, margin + 10, yPosition);
            yPosition += todoDescLines.length * 4 + 3;
          }
        });
        yPosition += 5;
      }

      // Add metadata
      yPosition += 10;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Created: ${new Date(spark.createdAt).toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Updated: ${new Date(spark.updatedAt).toLocaleDateString()}`, margin, yPosition);

      // Try to capture visual elements if a spark canvas exists
      try {
        const sparkElement = document.querySelector(`[data-spark-id="${spark.id}"]`);
        if (sparkElement) {
          const canvas = await html2canvas(sparkElement, {
            backgroundColor: null,
            scale: 2
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add new page for visual
          pdf.addPage();
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Visual Representation:", margin, margin);
          pdf.addImage(imgData, 'PNG', margin, margin + 10, imgWidth, imgHeight);
        }
      } catch (canvasError) {
        console.warn('Could not capture visual elements:', canvasError);
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error exporting spark to PDF:', error);
      throw new Error(`Failed to export spark to PDF: ${error.message}`);
    }
  }

  /**
   * Export a project with all sparks to PDF format
   * @param {Object} projectData - The project data containing sparks and metadata
   * @returns {Promise<Blob>} - Promise resolving to PDF blob
   */
  static async exportProjectToPDF(projectData) {
    try {
      const { sparks, connections = [], projectName = "Spark Project", statistics = {} } = projectData;
      
      if (!sparks || !Array.isArray(sparks)) {
        throw new Error('Invalid project data: sparks array is required');
      }

      const pdf = new jsPDF();
      const margin = 20;
      let yPosition = margin;

      // Project title page
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(projectName, margin, yPosition);
      yPosition += 20;

      // Project statistics
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Project Overview", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total Sparks: ${sparks.length}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total Connections: ${connections.length}`, margin, yPosition);
      yPosition += 6;

      // Calculate statistics
      const totalXP = sparks.reduce((sum, spark) => sum + (spark.xp || 0), 0);
      const completedTodos = sparks.reduce((sum, spark) => 
        sum + (spark.todos?.filter(todo => todo.completed).length || 0), 0);
      const totalTodos = sparks.reduce((sum, spark) => sum + (spark.todos?.length || 0), 0);

      pdf.text(`Total XP: ${totalXP}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Completed Tasks: ${completedTodos}/${totalTodos}`, margin, yPosition);
      yPosition += 6;

      // Status distribution
      const statusCounts = sparks.reduce((acc, spark) => {
        acc[spark.status] = (acc[spark.status] || 0) + 1;
        return acc;
      }, {});

      pdf.text("Status Distribution:", margin, yPosition);
      yPosition += 6;
      Object.entries(statusCounts).forEach(([status, count]) => {
        pdf.text(`  ${status}: ${count}`, margin + 10, yPosition);
        yPosition += 5;
      });

      yPosition += 10;

      // Export date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);

      // Try to capture project visualization
      try {
        const projectCanvas = document.querySelector('[data-project-canvas]') || 
                             document.querySelector('.spark-canvas') ||
                             document.querySelector('#spark-canvas');
        
        if (projectCanvas) {
          const canvas = await html2canvas(projectCanvas, {
            backgroundColor: '#ffffff',
            scale: 1.5,
            width: projectCanvas.scrollWidth,
            height: projectCanvas.scrollHeight
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 200);
          
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.text("Project Visualization", margin, margin);
          pdf.addImage(imgData, 'PNG', margin, margin + 10, imgWidth, imgHeight);
        }
      } catch (canvasError) {
        console.warn('Could not capture project visualization:', canvasError);
      }

      // Individual spark details
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Spark Details", margin, margin);
      yPosition = margin + 15;

      for (let i = 0; i < sparks.length; i++) {
        const spark = sparks[i];
        
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.height - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Spark header
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${i + 1}. ${spark.title}`, margin, yPosition);
        yPosition += 8;

        // Spark metadata
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Status: ${spark.status} | Level: ${spark.level} | XP: ${spark.xp}`, margin + 5, yPosition);
        yPosition += 6;

        if (spark.tags) {
          pdf.text(`Tags: ${spark.tags}`, margin + 5, yPosition);
          yPosition += 6;
        }

        // Spark description
        if (spark.description) {
          pdf.setFontSize(11);
          const descLines = pdf.splitTextToSize(spark.description, pdf.internal.pageSize.width - 2 * margin - 10);
          pdf.text(descLines, margin + 5, yPosition);
          yPosition += descLines.length * 4 + 3;
        }

        // Spark todos
        if (spark.todos && spark.todos.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("Tasks:", margin + 5, yPosition);
          yPosition += 5;

          spark.todos.forEach((todo) => {
            if (yPosition > pdf.internal.pageSize.height - 20) {
              pdf.addPage();
              yPosition = margin;
            }
            
            pdf.setFont("helvetica", "normal");
            const checkbox = todo.completed ? '☑' : '☐';
            pdf.text(`${checkbox} ${todo.title}`, margin + 10, yPosition);
            yPosition += 4;
          });
        }

        yPosition += 8; // Space between sparks
      }

      // Connection details
      if (connections.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Spark Connections", margin, margin);
        yPosition = margin + 15;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        
        connections.forEach((connection, index) => {
          if (yPosition > pdf.internal.pageSize.height - 20) {
            pdf.addPage();
            yPosition = margin;
          }

          const spark1 = sparks.find(s => s.id === connection.sparkId1);
          const spark2 = sparks.find(s => s.id === connection.sparkId2);
          
          if (spark1 && spark2) {
            pdf.text(`${index + 1}. ${spark1.title} ↔ ${spark2.title}`, margin, yPosition);
            yPosition += 6;
          }
        });
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error exporting project to PDF:', error);
      throw new Error(`Failed to export project to PDF: ${error.message}`);
    }
  }

  /**
   * Export all project data to JSON format
   * @param {Object} projectData - The complete project data to export
   * @returns {Promise<Object>} - Promise resolving to JSON object
   */
  static async exportToJSON(projectData) {
    try {
      const { 
        sparks, 
        connections = [], 
        userPreferences = {}, 
        projectName = "Spark Project",
        user = {},
        achievements = [],
        statistics = {},
        metadata = {}
      } = projectData;

      if (!sparks || !Array.isArray(sparks)) {
        throw new Error('Invalid project data: sparks array is required');
      }

      // Create a comprehensive JSON export structure
      const exportData = {
        // Export metadata
        export: {
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          type: "spark_project_export",
          projectName: projectName,
          totalSparks: sparks.length,
          totalConnections: connections.length
        },

        // User information
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          totalXP: user.totalXP || 0,
          level: user.level || 1,
          currentStreak: user.currentStreak || 0,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },

        // Project statistics
        statistics: {
          totalXP: sparks.reduce((sum, spark) => sum + (spark.xp || 0), 0),
          completedTodos: sparks.reduce((sum, spark) => 
            sum + (spark.todos?.filter(todo => todo.completed).length || 0), 0),
          totalTodos: sparks.reduce((sum, spark) => sum + (spark.todos?.length || 0), 0),
          sparksByStatus: sparks.reduce((acc, spark) => {
            acc[spark.status] = (acc[spark.status] || 0) + 1;
            return acc;
          }, {}),
          sparksByLevel: sparks.reduce((acc, spark) => {
            const level = spark.level || 1;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
          }, {}),
          attachmentCount: sparks.reduce((sum, spark) => sum + (spark.attachments?.length || 0), 0),
          averageSparkXP: sparks.length > 0 ? Math.round(sparks.reduce((sum, spark) => sum + (spark.xp || 0), 0) / sparks.length) : 0,
          ...statistics
        },

        // User preferences
        preferences: {
          theme: userPreferences.theme || 'AUTO',
          soundEnabled: userPreferences.soundEnabled ?? true,
          defaultSparkColor: userPreferences.defaultSparkColor || '#10b981',
          viewMode: userPreferences.viewMode || 'CANVAS',
          notifications: {
            email: userPreferences.emailNotifications ?? true,
            push: userPreferences.pushNotifications ?? true,
            inApp: userPreferences.inAppNotifications ?? true
          },
          ...userPreferences
        },

        // Sparks data with full details
        sparks: sparks.map(spark => ({
          id: spark.id,
          title: spark.title,
          description: spark.description,
          content: spark.content,
          status: spark.status,
          level: spark.level || 1,
          xp: spark.xp || 0,
          position: {
            x: spark.positionX,
            y: spark.positionY
          },
          color: spark.color || '#10b981',
          tags: spark.tags ? (typeof spark.tags === 'string' ? JSON.parse(spark.tags) : spark.tags) : [],
          createdAt: spark.createdAt,
          updatedAt: spark.updatedAt,
          
          // Todos with full details
          todos: (spark.todos || []).map(todo => ({
            id: todo.id,
            title: todo.title,
            description: todo.description,
            completed: todo.completed,
            type: todo.type || 'GENERAL',
            priority: todo.priority || 'MEDIUM',
            position: {
              x: todo.positionX,
              y: todo.positionY
            },
            createdAt: todo.createdAt,
            completedAt: todo.completedAt
          })),

          // Attachments with metadata
          attachments: (spark.attachments || []).map(attachment => ({
            id: attachment.id,
            filename: attachment.filename,
            url: attachment.url,
            type: attachment.type,
            size: attachment.size,
            createdAt: attachment.createdAt
          }))
        })),

        // Connection relationships
        connections: connections.map(connection => ({
          id: connection.id,
          sparkId1: connection.sparkId1,
          sparkId2: connection.sparkId2,
          type: connection.type || 'RELATED_TO',
          metadata: connection.metadata,
          createdAt: connection.createdAt,
          // Include spark titles for readability
          spark1Title: sparks.find(s => s.id === connection.sparkId1)?.title,
          spark2Title: sparks.find(s => s.id === connection.sparkId2)?.title
        })),

        // Achievement data
        achievements: achievements.map(achievement => ({
          id: achievement.id,
          achievementId: achievement.achievementId,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          type: achievement.type,
          unlockedAt: achievement.unlockedAt,
          createdAt: achievement.createdAt
        })),

        // Additional metadata
        metadata: {
          exportedBy: user.id,
          exportedAt: new Date().toISOString(),
          sparkCanvasVersion: "1.0.0",
          dataIntegrity: {
            sparksCount: sparks.length,
            connectionsCount: connections.length,
            todosCount: sparks.reduce((sum, spark) => sum + (spark.todos?.length || 0), 0),
            attachmentsCount: sparks.reduce((sum, spark) => sum + (spark.attachments?.length || 0), 0),
            achievementsCount: achievements.length
          },
          ...metadata
        }
      };

      // Validate export data structure
      this._validateExportData(exportData);

      return exportData;
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error(`Failed to export to JSON: ${error.message}`);
    }
  }

  /**
   * Validate the export data structure
   * @private
   * @param {Object} exportData - The export data to validate
   * @throws {Error} - If validation fails
   */
  static _validateExportData(exportData) {
    const requiredFields = ['export', 'user', 'sparks', 'connections', 'metadata'];
    
    for (const field of requiredFields) {
      if (!exportData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(exportData.sparks)) {
      throw new Error('Sparks must be an array');
    }

    if (!Array.isArray(exportData.connections)) {
      throw new Error('Connections must be an array');
    }

    // Validate spark structure
    for (const spark of exportData.sparks) {
      if (!spark.id || !spark.title) {
        throw new Error('Each spark must have id and title');
      }
      
      if (spark.todos && !Array.isArray(spark.todos)) {
        throw new Error(`Spark ${spark.id} todos must be an array`);
      }
      
      if (spark.attachments && !Array.isArray(spark.attachments)) {
        throw new Error(`Spark ${spark.id} attachments must be an array`);
      }
    }

    // Validate connection references
    const sparkIds = new Set(exportData.sparks.map(s => s.id));
    for (const connection of exportData.connections) {
      if (!sparkIds.has(connection.sparkId1) || !sparkIds.has(connection.sparkId2)) {
        throw new Error(`Connection ${connection.id} references non-existent sparks`);
      }
    }
  }
}
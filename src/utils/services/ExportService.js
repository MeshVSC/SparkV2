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
}
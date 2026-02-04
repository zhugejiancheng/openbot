/**
 * File Operations API for OpenBot
 * Provides file management capabilities through the web interface
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class FileApi {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath = '.') {
    try {
      const fullPath = path.resolve(this.baseDir, dirPath);
      const items = await fs.readdir(fullPath, { withFileTypes: true });
      
      const fileList = await Promise.all(items.map(async (item) => {
        const itemPath = path.join(fullPath, item.name);
        const stat = await fs.stat(itemPath);
        
        return {
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          modified: stat.mtime,
          path: path.relative(this.baseDir, itemPath)
        };
      }));
      
      return {
        success: true,
        directory: dirPath,
        items: fileList,
        count: fileList.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list directory: ${error.message}`
      };
    }
  }

  /**
   * Read a file
   */
  async readFile(filePath) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      return {
        success: true,
        path: filePath,
        content: content,
        size: Buffer.byteLength(content, 'utf8')
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  /**
   * Write to a file
   */
  async writeFile(filePath, content, options = {}) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file
      await fs.writeFile(fullPath, content, 'utf8');
      
      return {
        success: true,
        path: filePath,
        message: `Successfully wrote ${content.length} characters to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${error.message}`
      };
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      await fs.unlink(fullPath);
      
      return {
        success: true,
        path: filePath,
        message: `Successfully deleted ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath) {
    try {
      const fullPath = path.resolve(this.baseDir, dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      
      return {
        success: true,
        path: dirPath,
        message: `Successfully created directory ${dirPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create directory: ${error.message}`
      };
    }
  }

  /**
   * Get file/directory info
   */
  async getInfo(filePath) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      const stat = await fs.stat(fullPath);
      
      return {
        success: true,
        path: filePath,
        info: {
          name: path.basename(fullPath),
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime,
          accessed: stat.atime,
          permissions: stat.mode.toString(8).slice(-3)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get info: ${error.message}`
      };
    }
  }

  /**
   * Search for files by name
   */
  async searchFiles(pattern, searchPath = '.', maxDepth = 3) {
    try {
      const results = [];
      
      const searchRecursive = async (currentPath, depth) => {
        if (depth > maxDepth) return;
        
        const items = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item.name);
          const relativePath = path.relative(this.baseDir, itemPath);
          
          if (item.name.toLowerCase().includes(pattern.toLowerCase())) {
            const stat = await fs.stat(itemPath);
            results.push({
              name: item.name,
              path: relativePath,
              type: item.isDirectory() ? 'directory' : 'file',
              size: stat.size
            });
          }
          
          if (item.isDirectory()) {
            await searchRecursive(itemPath, depth + 1);
          }
        }
      };
      
      const fullPath = path.resolve(this.baseDir, searchPath);
      await searchRecursive(fullPath, 0);
      
      return {
        success: true,
        pattern: pattern,
        results: results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search files: ${error.message}`
      };
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(filePath, fileBuffer) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file buffer
      await fs.writeFile(fullPath, fileBuffer);
      
      return {
        success: true,
        path: filePath,
        message: `Successfully uploaded file to ${filePath}`,
        size: fileBuffer.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file: ${error.message}`
      };
    }
  }

  /**
   * Download a file
   */
  async downloadFile(filePath) {
    try {
      const fullPath = path.resolve(this.baseDir, filePath);
      const content = await fs.readFile(fullPath);
      
      return {
        success: true,
        path: filePath,
        content: content,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to download file: ${error.message}`
      };
    }
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      // Get disk space for the current directory
      const diskUsage = {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentUsed: ((usedMem / totalMem) * 100).toFixed(2)
      };
      
      return {
        success: true,
        diskUsage: diskUsage,
        currentDirectory: this.baseDir
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get disk usage: ${error.message}`
      };
    }
  }
}

module.exports = FileApi;
/**
 * Memory Storage System
 *
 * Persistent cross-session knowledge graph with semantic search.
 * Stores entities, relationships, and insights for RALPH agents.
 *
 * @module memory-manager
 */

import fs from 'fs-extra';
import path from 'path';

// Memory storage paths
const MEMORY_DIR = '.ralph/memory';
const ENTITIES_FILE = 'entities.json';
const RELATIONSHIPS_FILE = 'relationships.json';
const INSIGHTS_FILE = 'insights.json';

/**
 * Initialize memory storage
 * @param {string} projectRoot - Project root directory
 */
async function initMemory(projectRoot = process.cwd()) {
  const memoryPath = path.join(projectRoot, MEMORY_DIR);
  await fs.ensureDir(memoryPath);

  // Initialize entities file
  const entitiesPath = path.join(memoryPath, ENTITIES_FILE);
  if (!await fs.pathExists(entitiesPath)) {
    await fs.writeJson(entitiesPath, {
      version: '1.0.0',
      entities: []
    }, { spaces: 2 });
  }

  // Initialize relationships file
  const relationshipsPath = path.join(memoryPath, RELATIONSHIPS_FILE);
  if (!await fs.pathExists(relationshipsPath)) {
    await fs.writeJson(relationshipsPath, {
      version: '1.0.0',
      relationships: []
    }, { spaces: 2 });
  }

  // Initialize insights file
  const insightsPath = path.join(memoryPath, INSIGHTS_FILE);
  if (!await fs.pathExists(insightsPath)) {
    await fs.writeJson(insightsPath, {
      version: '1.0.0',
      insights: []
    }, { spaces: 2 });
  }
}

/**
 * Load a memory file
 * @param {string} filename - File name to load
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Loaded data
 */
async function loadMemoryFile(filename, projectRoot = process.cwd()) {
  const filePath = path.join(projectRoot, MEMORY_DIR, filename);

  await initMemory(projectRoot);

  try {
    return await fs.readJson(filePath);
  } catch (error) {
    return { version: '1.0.0', [filename.replace('.json', '')]: [] };
  }
}

/**
 * Save a memory file
 * @param {string} filename - File name to save
 * @param {Object} data - Data to save
 * @param {string} projectRoot - Project root directory
 */
async function saveMemoryFile(filename, data, projectRoot = process.cwd()) {
  const filePath = path.join(projectRoot, MEMORY_DIR, filename);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ ENTITIES ============

/**
 * Add an entity to memory
 * @param {string} type - Entity type (file, function, class, pattern, etc.)
 * @param {string} name - Entity name
 * @param {Object} properties - Entity properties
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Created entity
 */
async function addEntity(type, name, properties = {}, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(ENTITIES_FILE, projectRoot);

  // Check if entity already exists
  const existing = data.entities.find(e => e.type === type && e.name === name);
  if (existing) {
    // Update existing entity
    Object.assign(existing, {
      properties: { ...existing.properties, ...properties },
      updatedAt: new Date().toISOString()
    });
    await saveMemoryFile(ENTITIES_FILE, data, projectRoot);
    return existing;
  }

  // Create new entity
  const entity = {
    id: generateId(),
    type,
    name,
    properties,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.entities.push(entity);
  await saveMemoryFile(ENTITIES_FILE, data, projectRoot);

  return entity;
}

/**
 * Get an entity by type and name
 * @param {string} type - Entity type
 * @param {string} name - Entity name
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} Entity or null
 */
async function getEntity(type, name, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  return data.entities.find(e => e.type === type && e.name === name) || null;
}

/**
 * Get all entities of a type
 * @param {string} type - Entity type
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Array of entities
 */
async function getEntitiesByType(type, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  return data.entities.filter(e => e.type === type);
}

/**
 * Update an entity
 * @param {string} id - Entity ID
 * @param {Object} updates - Properties to update
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} Updated entity or null
 */
async function updateEntity(id, updates, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  const entity = data.entities.find(e => e.id === id);

  if (!entity) return null;

  Object.assign(entity, {
    ...updates,
    updatedAt: new Date().toISOString()
  });

  await saveMemoryFile(ENTITIES_FILE, data, projectRoot);
  return entity;
}

/**
 * Delete an entity
 * @param {string} id - Entity ID
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} Success status
 */
async function deleteEntity(id, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  const index = data.entities.findIndex(e => e.id === id);

  if (index === -1) return false;

  data.entities.splice(index, 1);
  await saveMemoryFile(ENTITIES_FILE, data, projectRoot);

  // Also delete related relationships
  const relData = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  relData.relationships = relData.relationships.filter(
    r => r.fromId !== id && r.toId !== id
  );
  await saveMemoryFile(RELATIONSHIPS_FILE, relData, projectRoot);

  return true;
}

// ============ RELATIONSHIPS ============

/**
 * Add a relationship between entities
 * @param {string} fromId - Source entity ID or name
 * @param {string} toId - Target entity ID or name
 * @param {string} type - Relationship type (uses, imports, extends, implements, etc.)
 * @param {Object} properties - Relationship properties
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Created relationship
 */
async function addRelationship(fromId, toId, type, properties = {}, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);

  // Check if relationship already exists
  const existing = data.relationships.find(
    r => r.fromId === fromId && r.toId === toId && r.type === type
  );

  if (existing) {
    // Update existing relationship
    Object.assign(existing, {
      properties: { ...existing.properties, ...properties },
      updatedAt: new Date().toISOString()
    });
    await saveMemoryFile(RELATIONSHIPS_FILE, data, projectRoot);
    return existing;
  }

  // Create new relationship
  const relationship = {
    id: generateId(),
    fromId,
    toId,
    type,
    properties,
    createdAt: new Date().toISOString()
  };

  data.relationships.push(relationship);
  await saveMemoryFile(RELATIONSHIPS_FILE, data, projectRoot);

  return relationship;
}

/**
 * Get relationships for an entity
 * @param {string} entityId - Entity ID
 * @param {string} direction - 'from', 'to', or 'both'
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Array of relationships
 */
async function getRelationships(entityId, direction = 'both', projectRoot = process.cwd()) {
  const data = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);

  return data.relationships.filter(r => {
    if (direction === 'from') return r.fromId === entityId;
    if (direction === 'to') return r.toId === entityId;
    return r.fromId === entityId || r.toId === entityId;
  });
}

/**
 * Get relationships by type
 * @param {string} type - Relationship type
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Array of relationships
 */
async function getRelationshipsByType(type, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  return data.relationships.filter(r => r.type === type);
}

// ============ INSIGHTS ============

/**
 * Add an insight to memory
 * @param {string} context - Context where insight was learned
 * @param {string} learning - What was learned
 * @param {Array} tags - Tags for categorization
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Created insight
 */
async function addInsight(context, learning, tags = [], projectRoot = process.cwd()) {
  const data = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  // Check for duplicate insight
  const existing = data.insights.find(i =>
    i.learning.toLowerCase() === learning.toLowerCase()
  );

  if (existing) {
    // Update tags and timestamp
    existing.tags = [...new Set([...existing.tags, ...tags])];
    existing.occurrences = (existing.occurrences || 1) + 1;
    existing.lastSeen = new Date().toISOString();
    await saveMemoryFile(INSIGHTS_FILE, data, projectRoot);
    return existing;
  }

  // Create new insight
  const insight = {
    id: generateId(),
    context,
    learning,
    tags,
    occurrences: 1,
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };

  data.insights.push(insight);
  await saveMemoryFile(INSIGHTS_FILE, data, projectRoot);

  return insight;
}

/**
 * Get insights by tags
 * @param {Array} tags - Tags to filter by
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Matching insights
 */
async function getInsightsByTags(tags, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  return data.insights.filter(insight =>
    tags.some(tag => insight.tags.includes(tag))
  );
}

/**
 * Get recent insights
 * @param {number} limit - Maximum number of insights
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Recent insights
 */
async function getRecentInsights(limit = 10, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  return data.insights
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
    .slice(0, limit);
}

/**
 * Get most frequent insights
 * @param {number} limit - Maximum number of insights
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Most frequent insights
 */
async function getMostFrequentInsights(limit = 10, projectRoot = process.cwd()) {
  const data = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  return data.insights
    .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1))
    .slice(0, limit);
}

// ============ QUERY ============

/**
 * Query memory with simple text matching
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters {type, tags, since}
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Query results
 */
async function queryMemory(query, filters = {}, projectRoot = process.cwd()) {
  const queryLower = query.toLowerCase();
  const results = {
    entities: [],
    relationships: [],
    insights: []
  };

  // Search entities
  const entitiesData = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  results.entities = entitiesData.entities.filter(entity => {
    // Apply type filter
    if (filters.type && entity.type !== filters.type) return false;

    // Text match on name and properties
    const nameMatch = entity.name.toLowerCase().includes(queryLower);
    const propsMatch = JSON.stringify(entity.properties).toLowerCase().includes(queryLower);

    return nameMatch || propsMatch;
  });

  // Search relationships
  const relData = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  results.relationships = relData.relationships.filter(rel => {
    const typeMatch = rel.type.toLowerCase().includes(queryLower);
    const propsMatch = JSON.stringify(rel.properties).toLowerCase().includes(queryLower);
    return typeMatch || propsMatch;
  });

  // Search insights
  const insightsData = await loadMemoryFile(INSIGHTS_FILE, projectRoot);
  results.insights = insightsData.insights.filter(insight => {
    // Apply tag filter
    if (filters.tags && !filters.tags.some(t => insight.tags.includes(t))) {
      return false;
    }

    // Apply date filter
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      if (new Date(insight.createdAt) < sinceDate) return false;
    }

    // Text match
    const contextMatch = insight.context.toLowerCase().includes(queryLower);
    const learningMatch = insight.learning.toLowerCase().includes(queryLower);
    const tagMatch = insight.tags.some(t => t.toLowerCase().includes(queryLower));

    return contextMatch || learningMatch || tagMatch;
  });

  return results;
}

// ============ STATISTICS ============

/**
 * Get memory statistics
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Memory statistics
 */
async function getMemoryStats(projectRoot = process.cwd()) {
  const entities = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  const relationships = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  const insights = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  // Count entities by type
  const entityTypes = {};
  for (const entity of entities.entities) {
    entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
  }

  // Count relationships by type
  const relationshipTypes = {};
  for (const rel of relationships.relationships) {
    relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
  }

  // Get unique tags from insights
  const allTags = new Set();
  for (const insight of insights.insights) {
    insight.tags.forEach(t => allTags.add(t));
  }

  return {
    entities: {
      total: entities.entities.length,
      byType: entityTypes
    },
    relationships: {
      total: relationships.relationships.length,
      byType: relationshipTypes
    },
    insights: {
      total: insights.insights.length,
      tags: [...allTags],
      totalOccurrences: insights.insights.reduce((sum, i) => sum + (i.occurrences || 1), 0)
    }
  };
}

// ============ CLEANUP ============

/**
 * Clean up old memory entries
 * @param {number} maxAgeDays - Maximum age in days
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Cleanup statistics
 */
async function cleanupMemory(maxAgeDays = 90, projectRoot = process.cwd()) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  const stats = { entities: 0, relationships: 0, insights: 0 };

  // Clean entities
  const entitiesData = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  const originalEntities = entitiesData.entities.length;
  entitiesData.entities = entitiesData.entities.filter(
    e => new Date(e.updatedAt) >= cutoffDate
  );
  stats.entities = originalEntities - entitiesData.entities.length;
  await saveMemoryFile(ENTITIES_FILE, entitiesData, projectRoot);

  // Clean relationships (keep if entities still exist)
  const entityIds = new Set(entitiesData.entities.map(e => e.id));
  const relData = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  const originalRels = relData.relationships.length;
  relData.relationships = relData.relationships.filter(
    r => entityIds.has(r.fromId) && entityIds.has(r.toId)
  );
  stats.relationships = originalRels - relData.relationships.length;
  await saveMemoryFile(RELATIONSHIPS_FILE, relData, projectRoot);

  // Clean insights (keep frequently occurring ones)
  const insightsData = await loadMemoryFile(INSIGHTS_FILE, projectRoot);
  const originalInsights = insightsData.insights.length;
  insightsData.insights = insightsData.insights.filter(
    i => new Date(i.lastSeen) >= cutoffDate || (i.occurrences || 1) >= 3
  );
  stats.insights = originalInsights - insightsData.insights.length;
  await saveMemoryFile(INSIGHTS_FILE, insightsData, projectRoot);

  return stats;
}

/**
 * Export memory to a single file
 * @param {string} outputPath - Output file path
 * @param {string} projectRoot - Project root directory
 */
async function exportMemory(outputPath, projectRoot = process.cwd()) {
  const entities = await loadMemoryFile(ENTITIES_FILE, projectRoot);
  const relationships = await loadMemoryFile(RELATIONSHIPS_FILE, projectRoot);
  const insights = await loadMemoryFile(INSIGHTS_FILE, projectRoot);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    entities: entities.entities,
    relationships: relationships.relationships,
    insights: insights.insights
  };

  await fs.writeJson(outputPath, exportData, { spaces: 2 });
}

/**
 * Import memory from a file
 * @param {string} inputPath - Input file path
 * @param {boolean} merge - Merge with existing (true) or replace (false)
 * @param {string} projectRoot - Project root directory
 */
async function importMemory(inputPath, merge = true, projectRoot = process.cwd()) {
  const importData = await fs.readJson(inputPath);

  if (merge) {
    // Merge with existing data
    for (const entity of importData.entities || []) {
      await addEntity(entity.type, entity.name, entity.properties, projectRoot);
    }

    for (const rel of importData.relationships || []) {
      await addRelationship(rel.fromId, rel.toId, rel.type, rel.properties, projectRoot);
    }

    for (const insight of importData.insights || []) {
      await addInsight(insight.context, insight.learning, insight.tags, projectRoot);
    }
  } else {
    // Replace existing data
    await saveMemoryFile(ENTITIES_FILE, {
      version: '1.0.0',
      entities: importData.entities || []
    }, projectRoot);

    await saveMemoryFile(RELATIONSHIPS_FILE, {
      version: '1.0.0',
      relationships: importData.relationships || []
    }, projectRoot);

    await saveMemoryFile(INSIGHTS_FILE, {
      version: '1.0.0',
      insights: importData.insights || []
    }, projectRoot);
  }
}

export {
  // Initialization
  initMemory,

  // Entities
  addEntity,
  getEntity,
  getEntitiesByType,
  updateEntity,
  deleteEntity,

  // Relationships
  addRelationship,
  getRelationships,
  getRelationshipsByType,

  // Insights
  addInsight,
  getInsightsByTags,
  getRecentInsights,
  getMostFrequentInsights,

  // Query
  queryMemory,

  // Statistics
  getMemoryStats,

  // Cleanup
  cleanupMemory,

  // Import/Export
  exportMemory,
  importMemory,

  // Constants
  MEMORY_DIR,
  ENTITIES_FILE,
  RELATIONSHIPS_FILE,
  INSIGHTS_FILE
};

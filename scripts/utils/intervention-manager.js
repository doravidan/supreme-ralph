/**
 * Intervention Manager
 *
 * Enables pause, resume, and rollback during RALPH execution.
 * Uses checkpoint system for safe recovery.
 *
 * @module intervention-manager
 */

import fs from 'fs-extra';
import path from 'path';

// Intervention file paths
const INTERVENTION_FILE = '.ralph/intervention.json';
const CHECKPOINTS_DIR = '.ralph/checkpoints';

// Intervention states
const STATES = {
  RUNNING: 'running',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

/**
 * Initialize intervention system
 * @param {string} projectRoot - Project root directory
 */
async function initIntervention(projectRoot = process.cwd()) {
  const interventionPath = path.join(projectRoot, INTERVENTION_FILE);
  const checkpointsPath = path.join(projectRoot, CHECKPOINTS_DIR);

  await fs.ensureDir(path.dirname(interventionPath));
  await fs.ensureDir(checkpointsPath);

  if (!await fs.pathExists(interventionPath)) {
    await fs.writeJson(interventionPath, {
      state: STATES.RUNNING,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentSubtask: null,
      completedSubtasks: [],
      checkpoints: []
    }, { spaces: 2 });
  }
}

/**
 * Load intervention state
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Intervention state
 */
async function loadIntervention(projectRoot = process.cwd()) {
  const interventionPath = path.join(projectRoot, INTERVENTION_FILE);

  if (await fs.pathExists(interventionPath)) {
    return await fs.readJson(interventionPath);
  }

  return {
    state: STATES.RUNNING,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    currentSubtask: null,
    completedSubtasks: [],
    checkpoints: []
  };
}

/**
 * Save intervention state
 * @param {Object} state - State to save
 * @param {string} projectRoot - Project root directory
 */
async function saveIntervention(state, projectRoot = process.cwd()) {
  const interventionPath = path.join(projectRoot, INTERVENTION_FILE);
  state.lastUpdated = new Date().toISOString();
  await fs.writeJson(interventionPath, state, { spaces: 2 });
}

/**
 * Check if RALPH should pause
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{shouldPause: boolean, reason: string}>}
 */
async function checkForPause(projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  if (state.state === STATES.PAUSED) {
    return {
      shouldPause: true,
      reason: state.pauseReason || 'User requested pause'
    };
  }

  if (state.state === STATES.CANCELLED) {
    return {
      shouldPause: true,
      reason: 'RALPH execution cancelled by user'
    };
  }

  return { shouldPause: false, reason: '' };
}

/**
 * Pause RALPH execution
 * @param {string} reason - Reason for pause
 * @param {string} projectRoot - Project root directory
 */
async function pause(reason = 'User requested pause', projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  state.state = STATES.PAUSED;
  state.pauseReason = reason;
  state.pausedAt = new Date().toISOString();

  await saveIntervention(state, projectRoot);

  return {
    success: true,
    message: `RALPH will pause after current subtask completes. Reason: ${reason}`
  };
}

/**
 * Resume RALPH execution
 * @param {string} projectRoot - Project root directory
 */
async function resume(projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  if (state.state !== STATES.PAUSED) {
    return {
      success: false,
      message: `Cannot resume: RALPH is ${state.state}, not paused`
    };
  }

  state.state = STATES.RUNNING;
  state.resumedAt = new Date().toISOString();
  delete state.pauseReason;
  delete state.pausedAt;

  await saveIntervention(state, projectRoot);

  return {
    success: true,
    message: 'RALPH resumed from last checkpoint',
    lastCheckpoint: state.checkpoints[state.checkpoints.length - 1]
  };
}

/**
 * Cancel RALPH execution
 * @param {string} reason - Reason for cancellation
 * @param {string} projectRoot - Project root directory
 */
async function cancel(reason = 'User requested cancellation', projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  state.state = STATES.CANCELLED;
  state.cancelReason = reason;
  state.cancelledAt = new Date().toISOString();

  await saveIntervention(state, projectRoot);

  return {
    success: true,
    message: `RALPH execution cancelled. Reason: ${reason}`
  };
}

/**
 * Create a checkpoint
 * @param {string} subtaskId - Completed subtask ID
 * @param {Object} data - Checkpoint data
 * @param {string} projectRoot - Project root directory
 */
async function createCheckpoint(subtaskId, data = {}, projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);
  const checkpointsDir = path.join(projectRoot, CHECKPOINTS_DIR);

  const checkpoint = {
    id: `cp-${Date.now()}`,
    subtaskId,
    createdAt: new Date().toISOString(),
    data
  };

  // Save checkpoint file
  const checkpointPath = path.join(checkpointsDir, `${checkpoint.id}.json`);
  await fs.writeJson(checkpointPath, checkpoint, { spaces: 2 });

  // Update intervention state
  state.checkpoints.push({
    id: checkpoint.id,
    subtaskId,
    createdAt: checkpoint.createdAt
  });

  if (!state.completedSubtasks.includes(subtaskId)) {
    state.completedSubtasks.push(subtaskId);
  }

  state.currentSubtask = null;

  await saveIntervention(state, projectRoot);

  return checkpoint;
}

/**
 * Get list of checkpoints
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} List of checkpoints
 */
async function listCheckpoints(projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);
  return state.checkpoints || [];
}

/**
 * Load a specific checkpoint
 * @param {string} checkpointId - Checkpoint ID
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} Checkpoint data or null
 */
async function loadCheckpoint(checkpointId, projectRoot = process.cwd()) {
  const checkpointPath = path.join(projectRoot, CHECKPOINTS_DIR, `${checkpointId}.json`);

  if (await fs.pathExists(checkpointPath)) {
    return await fs.readJson(checkpointPath);
  }

  return null;
}

/**
 * Rollback to a checkpoint
 * @param {string} checkpointId - Checkpoint ID to rollback to (or 'last')
 * @param {string} projectRoot - Project root directory
 */
async function rollback(checkpointId = 'last', projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  if (!state.checkpoints || state.checkpoints.length === 0) {
    return {
      success: false,
      message: 'No checkpoints available for rollback'
    };
  }

  let targetCheckpoint;

  if (checkpointId === 'last') {
    targetCheckpoint = state.checkpoints[state.checkpoints.length - 1];
  } else {
    targetCheckpoint = state.checkpoints.find(cp => cp.id === checkpointId);
  }

  if (!targetCheckpoint) {
    return {
      success: false,
      message: `Checkpoint not found: ${checkpointId}`
    };
  }

  // Load full checkpoint data
  const checkpointData = await loadCheckpoint(targetCheckpoint.id, projectRoot);

  if (!checkpointData) {
    return {
      success: false,
      message: `Checkpoint data not found: ${targetCheckpoint.id}`
    };
  }

  // Remove checkpoints after the target
  const targetIndex = state.checkpoints.findIndex(cp => cp.id === targetCheckpoint.id);
  const removedCheckpoints = state.checkpoints.splice(targetIndex + 1);

  // Remove completed subtasks after target
  const targetSubtaskIndex = state.completedSubtasks.indexOf(targetCheckpoint.subtaskId);
  if (targetSubtaskIndex >= 0) {
    state.completedSubtasks = state.completedSubtasks.slice(0, targetSubtaskIndex + 1);
  }

  // Clean up removed checkpoint files
  for (const removed of removedCheckpoints) {
    const removedPath = path.join(projectRoot, CHECKPOINTS_DIR, `${removed.id}.json`);
    await fs.remove(removedPath).catch(() => {});
  }

  // Update state
  state.state = STATES.PAUSED;
  state.rollbackFrom = checkpointId === 'last' ? 'latest' : checkpointId;
  state.rollbackTo = targetCheckpoint.id;
  state.rolledBackAt = new Date().toISOString();

  await saveIntervention(state, projectRoot);

  return {
    success: true,
    message: `Rolled back to checkpoint: ${targetCheckpoint.id}`,
    checkpoint: targetCheckpoint,
    removedCheckpoints: removedCheckpoints.length,
    nextStep: `Resume with /ralph-resume to continue from ${targetCheckpoint.subtaskId}`
  };
}

/**
 * Set current subtask
 * @param {string} subtaskId - Subtask being worked on
 * @param {string} projectRoot - Project root directory
 */
async function setCurrentSubtask(subtaskId, projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);
  state.currentSubtask = subtaskId;
  state.currentSubtaskStarted = new Date().toISOString();
  await saveIntervention(state, projectRoot);
}

/**
 * Get intervention status summary
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string>} Formatted status
 */
async function getStatus(projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  let statusIcon;
  switch (state.state) {
    case STATES.RUNNING: statusIcon = '▶️'; break;
    case STATES.PAUSED: statusIcon = '⏸️'; break;
    case STATES.CANCELLED: statusIcon = '⏹️'; break;
    case STATES.COMPLETED: statusIcon = '✅'; break;
    default: statusIcon = '❓';
  }

  return `
╔════════════════════════════════════════════════════════════════╗
║                 RALPH Intervention Status                       ║
╚════════════════════════════════════════════════════════════════╝

Status: ${statusIcon} ${state.state.toUpperCase()}
${state.pauseReason ? `Reason: ${state.pauseReason}` : ''}
${state.cancelReason ? `Reason: ${state.cancelReason}` : ''}

Started: ${state.startedAt}
Last Updated: ${state.lastUpdated}

Current Subtask: ${state.currentSubtask || 'None'}
Completed Subtasks: ${state.completedSubtasks?.length || 0}
Checkpoints: ${state.checkpoints?.length || 0}

${state.state === STATES.PAUSED ? `
To resume: /ralph-resume
To rollback: /ralph-rollback
To cancel: /ralph-cancel
` : ''}
${state.state === STATES.RUNNING ? `
To pause: /ralph-pause
To cancel: /ralph-cancel
` : ''}
`;
}

/**
 * Clean up old checkpoints
 * @param {number} keepLast - Number of checkpoints to keep
 * @param {string} projectRoot - Project root directory
 */
async function cleanupCheckpoints(keepLast = 5, projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  if (!state.checkpoints || state.checkpoints.length <= keepLast) {
    return { removed: 0 };
  }

  const toRemove = state.checkpoints.slice(0, -keepLast);
  const toKeep = state.checkpoints.slice(-keepLast);

  for (const checkpoint of toRemove) {
    const checkpointPath = path.join(projectRoot, CHECKPOINTS_DIR, `${checkpoint.id}.json`);
    await fs.remove(checkpointPath).catch(() => {});
  }

  state.checkpoints = toKeep;
  await saveIntervention(state, projectRoot);

  return { removed: toRemove.length };
}

/**
 * Mark RALPH as completed
 * @param {string} projectRoot - Project root directory
 */
async function complete(projectRoot = process.cwd()) {
  const state = await loadIntervention(projectRoot);

  state.state = STATES.COMPLETED;
  state.completedAt = new Date().toISOString();

  await saveIntervention(state, projectRoot);

  return {
    success: true,
    message: 'RALPH execution completed successfully'
  };
}

export {
  STATES,
  initIntervention,
  loadIntervention,
  saveIntervention,
  checkForPause,
  pause,
  resume,
  cancel,
  createCheckpoint,
  listCheckpoints,
  loadCheckpoint,
  rollback,
  setCurrentSubtask,
  getStatus,
  cleanupCheckpoints,
  complete,
  INTERVENTION_FILE,
  CHECKPOINTS_DIR
};

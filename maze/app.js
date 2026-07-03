"use strict";

const controls = {
  cellSize: document.querySelector("#cellSize"),
  width: document.querySelector("#mazeWidth"),
  height: document.querySelector("#mazeHeight"),
  percent: document.querySelector("#extraPercent"),
  percentValue: document.querySelector("#percentValue"),
  showLines: document.querySelector("#showLines"),
  generate: document.querySelector("#generateButton"),
  algorithm: document.querySelector("#algorithmSelect"),
  animationSpeed: document.querySelector("#animationSpeed"),
  animationSpeedValue: document.querySelector("#animationSpeedValue"),
  movementSpeed: document.querySelector("#movementSpeed"),
  movementSpeedValue: document.querySelector("#movementSpeedValue"),
  gridReadout: document.querySelector("#gridReadout"),
  pathReadout: document.querySelector("#pathReadout"),
  statusReadout: document.querySelector("#statusReadout"),
  canvas: document.querySelector("#mazeCanvas")
};

const ctx = controls.canvas.getContext("2d");
const wallSprite = new Image();
wallSprite.src = "assets/wall.png";
const STORAGE_KEY = "mazeExperimentSettings";

let state = createState();

function createState() {
  return {
    cellSize: 16,
    logicalWidth: 10,
    logicalHeight: 7,
    percent: 0,
    cols: 21,
    rows: 15,
    start: null,
    end: null,
    path: [],
    correctLoopSegments: [],
    secondaryPoints: [],
    secondarySegments: [],
    secondaryWallPoints: [],
    secondaryWallKeys: new Set(),
    secondaryCells: 0,
    secondaryLoops: 0,
    correctLoops: 0,
    falseBranchStats: null,
    showLines: true,
    animationSpeed: 45,
    movementSpeed: 120,
    animationRun: 0,
    isAnimating: false,
    temperature: new Map(),
    temperatureMax: 0,
    bfsPath: [],
    aStarOpen: new Map(),
    aStarClosed: new Map(),
    aStarCurrent: null,
    aStarPath: [],
    biVisitedA: new Map(),
    biVisitedB: new Map(),
    biFrontA: new Set(),
    biFrontB: new Set(),
    biMeet: null,
    biPath: [],
    traveler: null,
    targetLength: 0,
    requestedLength: 0,
    shortestLength: 0,
    wasAdjusted: false,
    message: "paredes certas: g impar, impar"
  };
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function loadSavedControls() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return;

    controls.cellSize.value = clampInt(saved.cellSize, 1, 40, 16);
    controls.width.value = clampInt(saved.logicalWidth, 1, 1000, 10);
    controls.height.value = clampInt(saved.logicalHeight, 1, 1000, 7);
    controls.percent.value = clampInt(saved.percent, 0, 50, 0);
    controls.animationSpeed.value = clampInt(saved.animationSpeed, 1, 100, 45);
    controls.movementSpeed.value = clampInt(saved.movementSpeed, 1, 300, 120);
    controls.showLines.checked = saved.showLines !== false;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveControls() {
  const settings = {
    cellSize: state.cellSize,
    logicalWidth: state.logicalWidth,
    logicalHeight: state.logicalHeight,
    percent: state.percent,
    showLines: state.showLines,
    animationSpeed: state.animationSpeed,
    movementSpeed: state.movementSpeed
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage failures; the maze should still work without persistence.
  }
}

function syncStateFromControls() {
  state.cellSize = clampInt(controls.cellSize.value, 1, 40, 16);
  state.logicalWidth = clampInt(controls.width.value, 1, 1000, 10);
  state.logicalHeight = clampInt(controls.height.value, 1, 1000, 7);
  state.percent = clampInt(controls.percent.value, 0, 50, 0);
  state.animationSpeed = clampInt(controls.animationSpeed.value, 1, 100, 45);
  state.movementSpeed = clampInt(controls.movementSpeed.value, 1, 300, 120);
  state.showLines = controls.showLines.checked;
  state.cols = state.logicalWidth * 2 + 1;
  state.rows = state.logicalHeight * 2 + 1;

  controls.cellSize.value = state.cellSize;
  controls.width.value = state.logicalWidth;
  controls.height.value = state.logicalHeight;
  controls.percent.value = state.percent;
  controls.percentValue.value = `${state.percent}%`;
  controls.animationSpeed.value = state.animationSpeed;
  controls.animationSpeedValue.value = `${state.animationSpeed}`;
  controls.movementSpeed.value = state.movementSpeed;
  controls.movementSpeedValue.value = `${state.movementSpeed}`;
}

function isCertainWall(x, y) {
  return x % 2 === 1 && y % 2 === 1;
}

function isAndCell(x, y) {
  return x % 2 === 0 && y % 2 === 0;
}

function isXorCell(x, y) {
  return (x % 2 === 1) !== (y % 2 === 1);
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < state.cols && y < state.rows;
}

function indexOf(point) {
  return point.y * state.cols + point.x;
}

function pointFromIndex(index) {
  return {
    x: index % state.cols,
    y: Math.floor(index / state.cols)
  };
}

function samePoint(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function getNeighbors(point, shuffle = false) {
  const items = [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 }
  ].filter((next) => isInside(next.x, next.y) && !isCertainWall(next.x, next.y));

  return shuffle ? shuffleArray(items) : items;
}

function isSearchWall(x, y) {
  return isCertainWall(x, y) || state.secondaryWallKeys.has(`${x},${y}`);
}

function getSearchNeighbors(point) {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 }
  ].filter((next) => isInside(next.x, next.y) && !isSearchWall(next.x, next.y));
}

function shuffleArray(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFreeCells() {
  const cells = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!isCertainWall(x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

function getAndCells() {
  const cells = [];
  for (let y = 0; y < state.rows; y += 2) {
    for (let x = 0; x < state.cols; x += 2) {
      if (isAndCell(x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

function bfsPath(start, end, blocked = null, randomize = false) {
  const total = state.cols * state.rows;
  const startIndex = indexOf(start);
  const endIndex = indexOf(end);
  const queue = [start];
  const visited = new Uint8Array(total);
  const previous = new Int32Array(total);
  previous.fill(-1);
  visited[startIndex] = 1;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const currentIndex = indexOf(current);
    if (currentIndex === endIndex) break;

    for (const next of getNeighbors(current, randomize)) {
      const nextIndex = indexOf(next);
      const isBlocked = blocked && blocked[nextIndex] && nextIndex !== endIndex;
      if (visited[nextIndex] || isBlocked) continue;
      visited[nextIndex] = 1;
      previous[nextIndex] = currentIndex;
      queue.push(next);
    }
  }

  if (!visited[endIndex]) return null;

  const path = [];
  let walker = endIndex;
  while (walker !== -1) {
    path.push(pointFromIndex(walker));
    if (walker === startIndex) break;
    walker = previous[walker];
  }

  return path.reverse();
}

function bfsDistanceAndReachable(start, end, blocked) {
  const total = state.cols * state.rows;
  const startIndex = indexOf(start);
  const endIndex = indexOf(end);
  const queue = [start];
  const visited = new Uint8Array(total);
  const distance = new Int32Array(total);
  distance.fill(-1);
  visited[startIndex] = 1;
  distance[startIndex] = 0;
  let reachable = 0;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    reachable += 1;

    for (const next of getNeighbors(current, false)) {
      const nextIndex = indexOf(next);
      const isBlocked = blocked[nextIndex] && nextIndex !== startIndex && nextIndex !== endIndex;
      if (visited[nextIndex] || isBlocked) continue;
      visited[nextIndex] = 1;
      distance[nextIndex] = distance[indexOf(current)] + 1;
      queue.push(next);
    }
  }

  return {
    distance: distance[endIndex],
    reachable
  };
}

function chooseRandomPair() {
  const start = { x: 0, y: 0 };
  const end = { x: state.cols - 1, y: state.rows - 1 };
  const shortest = bfsPath(start, end, null, true);
  return shortest
    ? { start, end, shortest, min: manhattan(start, end) }
    : null;
}

function getBottomRightAndCells() {
  const minX = Math.max(0, state.cols - 1 - Math.max(2, Math.floor(state.logicalWidth * 0.5)) * 2);
  const minY = Math.max(0, state.rows - 1 - Math.max(2, Math.floor(state.logicalHeight * 0.5)) * 2);
  const cells = [];

  for (let y = state.rows - 1; y >= minY; y -= 2) {
    for (let x = state.cols - 1; x >= minX; x -= 2) {
      if (isAndCell(x, y) && (x !== 0 || y !== 0)) {
        cells.push({ x, y });
      }
    }
  }

  return cells.sort((a, b) => {
    const distanceA = manhattan(a, { x: state.cols - 1, y: state.rows - 1 });
    const distanceB = manhattan(b, { x: state.cols - 1, y: state.rows - 1 });
    return distanceA - distanceB + (Math.random() - 0.5) * 4;
  });
}

function roomKey(room) {
  return `${room.x},${room.y}`;
}

function roomToCell(room) {
  return {
    x: room.x * 2,
    y: room.y * 2
  };
}

function getRoomNeighbors(room) {
  return [
    { x: room.x + 1, y: room.y },
    { x: room.x - 1, y: room.y },
    { x: room.x, y: room.y + 1 },
    { x: room.x, y: room.y - 1 }
  ].filter((next) => (
    next.x >= 0 &&
    next.y >= 0 &&
    next.x <= state.logicalWidth &&
    next.y <= state.logicalHeight
  ));
}

function addRoomLine(path, visited, current, target) {
  let cursor = { ...current };

  while (cursor.x !== target.x) {
    cursor = {
      x: cursor.x + Math.sign(target.x - cursor.x),
      y: cursor.y
    };
    const key = roomKey(cursor);
    if (!visited.has(key)) {
      path.push(cursor);
      visited.add(key);
    }
  }

  while (cursor.y !== target.y) {
    cursor = {
      x: cursor.x,
      y: cursor.y + Math.sign(target.y - cursor.y)
    };
    const key = roomKey(cursor);
    if (!visited.has(key)) {
      path.push(cursor);
      visited.add(key);
    }
  }

  return cursor;
}

function buildLaneBackboneRooms(start, end) {
  const endRoom = { x: end.x / 2, y: end.y / 2 };
  const path = [{ x: start.x / 2, y: start.y / 2 }];
  const visited = new Set([roomKey(path[0])]);
  let current = path[0];
  const lastLaneY = endRoom.y % 2 === 0 ? endRoom.y : Math.max(0, endRoom.y - 1);

  for (let laneY = 0, laneIndex = 0; laneY <= lastLaneY; laneY += 2, laneIndex += 1) {
    current = addRoomLine(path, visited, current, { x: current.x, y: laneY });

    const isFinalLane = laneY === lastLaneY;
    const directionRight = laneIndex % 2 === 0;
    const laneTargetX = isFinalLane ? endRoom.x : (directionRight ? state.logicalWidth : 0);
    current = addRoomLine(path, visited, current, { x: laneTargetX, y: laneY });

    if (isFinalLane) {
      current = addRoomLine(path, visited, current, { x: current.x, y: endRoom.y });
      current = addRoomLine(path, visited, current, endRoom);
      break;
    }
  }

  return path;
}

function getCorridorCellBetweenRooms(a, b) {
  const cellA = roomToCell(a);
  const cellB = roomToCell(b);
  return {
    x: (cellA.x + cellB.x) / 2,
    y: (cellA.y + cellB.y) / 2
  };
}

function expandRoomPath(roomPath) {
  const cells = [roomToCell(roomPath[0])];

  for (let i = 1; i < roomPath.length; i += 1) {
    cells.push(getCorridorCellBetweenRooms(roomPath[i - 1], roomPath[i]));
    cells.push(roomToCell(roomPath[i]));
  }

  return cells;
}

function addNetworkCell(point, usedKeys, list = null) {
  const key = `${point.x},${point.y}`;
  usedKeys.add(key);
  if (list && !list.some((item) => item.x === point.x && item.y === point.y)) {
    list.push(point);
  }
}

function addCellSegment(a, b, segments, usedKeys, points = null, isLoop = false) {
  addNetworkCell(a, usedKeys, points);
  addNetworkCell(b, usedKeys, points);
  segments.push({ a, b, isLoop });
}

function addRoomEdgeSegments(a, b, segments, usedKeys, points = null, isLoop = false) {
  const cellA = roomToCell(a);
  const corridor = getCorridorCellBetweenRooms(a, b);
  const cellB = roomToCell(b);
  addCellSegment(cellA, corridor, segments, usedKeys, points, isLoop);
  addCellSegment(corridor, cellB, segments, usedKeys, points, isLoop);
}

function buildParallelMazeNetwork(start, end) {
  let best = null;
  let bestScore = -Infinity;
  const attempts = state.logicalWidth * state.logicalHeight > 130 ? 11 : 24;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = buildTreeMazeCandidate(start, end);
    const score = scoreTreeMazeCandidate(candidate);

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (best && !best.falseBranchStats) {
    best.falseBranchStats = analyzeFalseBranchShape(best);
  }

  return best;
}

function buildTreeMazeCandidate(start, end) {
  const startRoom = { x: start.x / 2, y: start.y / 2 };
  const endRoom = { x: end.x / 2, y: end.y / 2 };
  const totalRooms = (state.logicalWidth + 1) * (state.logicalHeight + 1);
  const visited = new Set([roomKey(startRoom)]);
  const active = [startRoom];
  const parents = new Map();
  const directions = new Map();
  const treeEdges = [];

  while (visited.size < totalRooms && active.length) {
    const activeIndex = Math.random() < 0.58 ? active.length - 1 : Math.floor(Math.random() * active.length);
    const current = active[activeIndex];
    const candidates = getRoomNeighbors(current).filter((next) => !visited.has(roomKey(next)));

    if (!candidates.length) {
      active.splice(activeIndex, 1);
      continue;
    }

    const next = chooseTreeNeighbor(current, candidates, directions, parents, visited, totalRooms, endRoom);
    const nextKey = roomKey(next);
    visited.add(nextKey);
    parents.set(nextKey, current);
    directions.set(nextKey, getRoomDirection(current, next));
    treeEdges.push({ a: current, b: next });

    if (!samePoint(next, endRoom)) {
      active.push(next);
    }
  }

  return materializeTreeMaze(startRoom, endRoom, parents, treeEdges);
}

function chooseTreeNeighbor(current, candidates, directions, parents, visited, totalRooms, endRoom) {
  const currentDirection = directions.get(roomKey(current)) || null;
  const straightRun = getRoomStraightRun(current, parents, directions);

  return candidates
    .map((next) => {
      const direction = getRoomDirection(current, next);
      const keepsDirection = currentDirection && sameDirection(direction, currentDirection);
      const turnScore = keepsDirection ? -0.8 - Math.max(0, straightRun - 1) * 0.7 : 0.8;
      const verticalScore = direction.y !== 0 ? 0.18 : -0.12;
      const densityScore = getRoomNeighbors(next).filter((item) => !visited.has(roomKey(item))).length * 0.08;
      const endTooEarly = samePoint(next, endRoom) && visited.size < totalRooms * 0.58 && candidates.length > 1 ? -4 : 0;

      return {
        point: next,
        score: Math.random() + turnScore + verticalScore + densityScore + endTooEarly
      };
    })
    .sort((a, b) => b.score - a.score)[0].point;
}

function getRoomDirection(a, b) {
  return {
    x: Math.sign(b.x - a.x),
    y: Math.sign(b.y - a.y)
  };
}

function getRoomStraightRun(room, parents, directions) {
  let run = 0;
  let cursor = room;
  let direction = directions.get(roomKey(cursor));

  while (direction) {
    run += 1;
    const parent = parents.get(roomKey(cursor));
    if (!parent) break;

    const parentDirection = directions.get(roomKey(parent));
    if (!parentDirection || !sameDirection(direction, parentDirection)) break;
    cursor = parent;
    direction = parentDirection;
  }

  return run;
}

function materializeTreeMaze(startRoom, endRoom, parents, treeEdges) {
  const solutionRooms = [];
  let cursor = endRoom;

  while (cursor) {
    solutionRooms.push(cursor);
    if (samePoint(cursor, startRoom)) break;
    cursor = parents.get(roomKey(cursor));
  }

  solutionRooms.reverse();

  if (!samePoint(solutionRooms[0], startRoom)) {
    solutionRooms.unshift(startRoom);
  }

  const solutionRoomKeys = new Set(solutionRooms.map(roomKey));
  const solutionEdgeKeys = new Set();
  for (let i = 1; i < solutionRooms.length; i += 1) {
    solutionEdgeKeys.add(makeRoomEdgeKey(solutionRooms[i - 1], solutionRooms[i]));
  }

  const primaryPath = expandRoomPath(solutionRooms);
  const primaryCellKeys = new Set(primaryPath.map((point) => `${point.x},${point.y}`));
  const usedCellKeys = new Set(primaryCellKeys);
  const secondaryPoints = [];
  const secondarySegments = [];

  for (let y = 0; y <= state.logicalHeight; y += 1) {
    for (let x = 0; x <= state.logicalWidth; x += 1) {
      const point = roomToCell({ x, y });
      const key = `${point.x},${point.y}`;
      usedCellKeys.add(key);
      if (!primaryCellKeys.has(key)) {
        secondaryPoints.push(point);
      }
    }
  }

  for (const edge of treeEdges) {
    const edgeKey = makeRoomEdgeKey(edge.a, edge.b);
    const cells = [roomToCell(edge.a), getCorridorCellBetweenRooms(edge.a, edge.b), roomToCell(edge.b)];

    for (const point of cells) {
      usedCellKeys.add(`${point.x},${point.y}`);
    }

    if (solutionEdgeKeys.has(edgeKey)) continue;

    for (let i = 1; i < cells.length; i += 1) {
      secondarySegments.push({ a: cells[i - 1], b: cells[i], isLoop: false });
    }

    for (const point of cells) {
      const key = `${point.x},${point.y}`;
      if (!primaryCellKeys.has(key) && !secondaryPoints.some((item) => item.x === point.x && item.y === point.y)) {
        secondaryPoints.push(point);
      }
    }
  }

  const wallData = buildWallsFromUnusedXor(usedCellKeys);

  return {
    path: primaryPath,
    correctLoopSegments: [],
    correctLoops: 0,
    secondaryPoints,
    secondarySegments,
    secondaryWallPoints: wallData.points,
    secondaryWallKeys: wallData.keys,
    secondaryCells: secondaryPoints.length,
    secondaryLoops: 0,
    solutionRooms,
    treeEdges
  };
}

function makeRoomEdgeKey(a, b) {
  const first = roomKey(a);
  const second = roomKey(b);
  return first < second ? `${first}:${second}` : `${second}:${first}`;
}

function scoreTreeMazeCandidate(candidate) {
  const maxStraight = getMaxStraightInPath(candidate.path);
  const earlyLimit = Math.max(4, Math.floor(candidate.path.length * 0.32));
  const earlyKeys = new Set(candidate.path.slice(0, earlyLimit).map((point) => `${point.x},${point.y}`));
  const earlyBranches = candidate.secondarySegments.filter((segment) => (
    earlyKeys.has(`${segment.a.x},${segment.a.y}`) ||
    earlyKeys.has(`${segment.b.x},${segment.b.y}`)
  )).length;
  const broadness = new Set(candidate.path.map((point) => `${Math.floor(point.x / 4)},${Math.floor(point.y / 4)}`)).size;
  const secondaryRatio = candidate.secondarySegments.length / Math.max(1, candidate.path.length);
  const branchStats = analyzeFalseBranchShape(candidate);
  candidate.falseBranchStats = branchStats;

  return (
    earlyBranches * 12 +
    broadness * 4 +
    secondaryRatio * 5 +
    branchStats.maxDepth * 7 +
    branchStats.longBranchCount * 18 +
    branchStats.nearEndLongBranchCount * 26 +
    branchStats.depthSpread * 4 +
    branchStats.lengthVariety * 7 -
    branchStats.uniformityPenalty * 10 -
    maxStraight * 9
  );
}

function analyzeFalseBranchShape(candidate) {
  const solutionKeys = new Set(candidate.solutionRooms.map(roomKey));
  const solutionIndex = new Map(candidate.solutionRooms.map((room, index) => [roomKey(room), index]));
  const endRoom = candidate.solutionRooms[candidate.solutionRooms.length - 1];
  const adjacency = new Map();

  const addAdjacent = (a, b) => {
    const aKey = roomKey(a);
    const bKey = roomKey(b);
    if (!adjacency.has(aKey)) adjacency.set(aKey, []);
    if (!adjacency.has(bKey)) adjacency.set(bKey, []);
    adjacency.get(aKey).push(b);
    adjacency.get(bKey).push(a);
  };

  for (const edge of candidate.treeEdges) {
    addAdjacent(edge.a, edge.b);
  }

  const branchDepths = [];
  let longBranchCount = 0;
  let nearEndLongBranchCount = 0;
  const longThreshold = Math.max(4, Math.floor(Math.max(state.logicalWidth, state.logicalHeight) * 0.65));

  for (const room of candidate.solutionRooms) {
    const attachIndex = solutionIndex.get(roomKey(room));
    const neighbors = adjacency.get(roomKey(room)) || [];

    for (const next of neighbors) {
      if (solutionKeys.has(roomKey(next))) continue;

      const stats = measureFalseSubtree(next, room, solutionKeys, adjacency, endRoom);
      branchDepths.push(stats.maxDepth);

      if (stats.maxDepth >= longThreshold) {
        longBranchCount += 1;
      }

      const attachedLate = attachIndex / Math.max(1, candidate.solutionRooms.length - 1) > 0.55;
      if (stats.maxDepth >= Math.max(3, Math.floor(longThreshold * 0.75)) && (stats.closestToEnd <= 3 || attachedLate)) {
        nearEndLongBranchCount += 1;
      }
    }
  }

  const maxDepth = branchDepths.length ? Math.max(...branchDepths) : 0;
  const minDepth = branchDepths.length ? Math.min(...branchDepths) : 0;
  const average = branchDepths.reduce((sum, value) => sum + value, 0) / Math.max(1, branchDepths.length);
  const variance = branchDepths.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, branchDepths.length);
  const depthSpread = maxDepth - minDepth;
  const lengthBuckets = new Set(branchDepths.map((value) => Math.min(5, Math.floor(value / 3))));
  const repeatedMidBranches = branchDepths.filter((value) => Math.abs(value - average) <= 1.2).length;

  return {
    maxDepth,
    longBranchCount,
    nearEndLongBranchCount,
    depthSpread,
    lengthVariety: lengthBuckets.size + Math.sqrt(variance),
    uniformityPenalty: branchDepths.length > 4 ? repeatedMidBranches / branchDepths.length : 0
  };
}

function measureFalseSubtree(root, parent, solutionKeys, adjacency, endRoom) {
  const stack = [{ room: root, parent, depth: 1 }];
  let maxDepth = 1;
  let closestToEnd = manhattan(root, endRoom);

  while (stack.length) {
    const current = stack.pop();
    maxDepth = Math.max(maxDepth, current.depth);
    closestToEnd = Math.min(closestToEnd, manhattan(current.room, endRoom));

    for (const next of adjacency.get(roomKey(current.room)) || []) {
      if (samePoint(next, current.parent) || solutionKeys.has(roomKey(next))) continue;
      stack.push({
        room: next,
        parent: current.room,
        depth: current.depth + 1
      });
    }
  }

  return {
    maxDepth,
    closestToEnd
  };
}

function growSecondaryRooms(startRoom, primaryRoomKeys, secondaryRoomKeys, segments, usedCellKeys, points) {
  const stack = [startRoom];
  let lastDirection = null;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const candidates = getRoomNeighbors(current)
      .filter((next) => !primaryRoomKeys.has(roomKey(next)) && !secondaryRoomKeys.has(roomKey(next)))
      .map((next) => {
        const direction = {
          x: Math.sign(next.x - current.x),
          y: Math.sign(next.y - current.y)
        };
        return {
          point: next,
          direction,
          score: Math.random() + (lastDirection && sameDirection(direction, lastDirection) ? 0.55 : 0)
        };
      })
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const next = candidates[0].point;
    lastDirection = candidates[0].direction;
    secondaryRoomKeys.add(roomKey(next));
    addRoomEdgeSegments(current, next, segments, usedCellKeys, points);
    stack.push(next);
  }
}

function addCorrectRoomLoops(primaryRooms, primaryRoomKeys, secondaryRoomKeys, segments, usedCellKeys) {
  let added = 0;
  const maxLoops = state.percent >= 30 ? 3 : 1;
  const primaryIndex = new Map(primaryRooms.map((room, index) => [roomKey(room), index]));

  for (const room of shuffleArray(primaryRooms)) {
    if (added >= maxLoops) break;

    for (const next of getRoomNeighbors(room)) {
      const roomIndex = primaryIndex.get(roomKey(room));
      const nextIndex = primaryIndex.get(roomKey(next));
      if (nextIndex === undefined || Math.abs(roomIndex - nextIndex) <= 2) continue;

      const corridor = getCorridorCellBetweenRooms(room, next);
      if (usedCellKeys.has(`${corridor.x},${corridor.y}`)) continue;

      addRoomEdgeSegments(room, next, segments, usedCellKeys, null, true);
      added += 1;
      break;
    }
  }

  if (added < maxLoops) {
    const earlyRooms = primaryRooms.slice(0, Math.max(4, Math.floor(primaryRooms.length * 0.45)));

    for (const room of shuffleArray(earlyRooms)) {
      if (added >= maxLoops) break;

      for (const next of shuffleArray(getRoomNeighbors(room))) {
        if (!secondaryRoomKeys.has(roomKey(next))) continue;

        const corridor = getCorridorCellBetweenRooms(room, next);
        if (usedCellKeys.has(`${corridor.x},${corridor.y}`)) continue;

        addRoomEdgeSegments(room, next, segments, usedCellKeys, null, true);
        added += 1;
        break;
      }
    }
  }

  return added;
}

function addFalseRoomLoops(primaryRoomKeys, secondaryRoomKeys, segments, usedCellKeys, points) {
  let added = 0;
  const maxLoops = Math.max(1, Math.floor(secondaryRoomKeys.size * 0.025));
  const segmentKeys = new Set(segments.map((segment) => makeSegmentKey(segment.a, segment.b)));

  for (const key of shuffleArray([...secondaryRoomKeys])) {
    if (added >= maxLoops) break;
    const [x, y] = key.split(",").map(Number);
    const room = { x, y };

    for (const next of getRoomNeighbors(room)) {
      const nextKey = roomKey(next);
      if (primaryRoomKeys.has(nextKey) || !secondaryRoomKeys.has(nextKey)) continue;

      const cellA = roomToCell(room);
      const corridor = getCorridorCellBetweenRooms(room, next);
      const cellB = roomToCell(next);
      if (usedCellKeys.has(`${corridor.x},${corridor.y}`)) continue;
      if (segmentKeys.has(makeSegmentKey(cellA, corridor)) || segmentKeys.has(makeSegmentKey(corridor, cellB))) continue;
      if (Math.random() > 0.18) continue;

      addRoomEdgeSegments(room, next, segments, usedCellKeys, points, true);
      added += 1;
      break;
    }
  }

  return added;
}

function addEarlyFalseConnectors(primaryRooms, secondaryRoomKeys, segments, usedCellKeys, points) {
  let added = 0;
  const maxConnectors = Math.min(5, Math.max(2, Math.floor(primaryRooms.length * 0.08)));
  const earlyRooms = primaryRooms.slice(0, Math.max(4, Math.floor(primaryRooms.length * 0.35)));

  for (const room of shuffleArray(earlyRooms)) {
    if (added >= maxConnectors) break;

    for (const next of shuffleArray(getRoomNeighbors(room))) {
      const nextKey = roomKey(next);
      if (!secondaryRoomKeys.has(nextKey)) continue;

      const corridor = getCorridorCellBetweenRooms(room, next);
      if (usedCellKeys.has(`${corridor.x},${corridor.y}`)) continue;

      addRoomEdgeSegments(room, next, segments, usedCellKeys, points, true);
      added += 1;
      break;
    }
  }

  return added;
}

function buildWallsFromUnusedXor(usedCellKeys) {
  const keys = new Set();
  const points = [];

  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const key = `${x},${y}`;
      if (isXorCell(x, y) && !usedCellKeys.has(key)) {
        keys.add(key);
        points.push({ x, y });
      }
    }
  }

  return { keys, points };
}

function makeSegmentKey(a, b) {
  const aIndex = indexOf(a);
  const bIndex = indexOf(b);
  return aIndex < bIndex ? `${aIndex}:${bIndex}` : `${bIndex}:${aIndex}`;
}

function buildSecondaryNetwork(primaryPath) {
  const total = state.cols * state.rows;
  const primary = new Uint8Array(total);
  const secondary = new Uint8Array(total);
  const parent = new Int32Array(total);
  const segmentKeys = new Set();
  const secondaryPoints = [];
  const segments = [];
  let secondaryCells = 0;
  let loops = 0;

  parent.fill(-1);

  for (const point of primaryPath) {
    primary[indexOf(point)] = 1;
  }

  const addSegment = (a, b, isLoop = false) => {
    const key = makeSegmentKey(a, b);
    if (segmentKeys.has(key)) return false;
    segmentKeys.add(key);
    segments.push({ a, b, isLoop });
    if (isLoop) loops += 1;
    return true;
  };

  const markSecondary = (point) => {
    const index = indexOf(point);
    if (!secondary[index]) {
      secondary[index] = 1;
      secondaryPoints.push(point);
      secondaryCells += 1;
    }
  };

  const roots = shuffleArray(primaryPath)
    .flatMap((root) => getNeighbors(root, true).map((next) => ({ root, next })))
    .filter(({ next }) => !primary[indexOf(next)]);

  for (const { root, next } of roots) {
    const nextIndex = indexOf(next);
    if (secondary[nextIndex]) continue;
    markSecondary(next);
    parent[nextIndex] = indexOf(root);
    addSegment(root, next);
    growSecondaryFrom(next, primary, secondary, parent, markSecondary, addSegment);
  }

  for (const cell of shuffleArray(getFreeCells())) {
    const cellIndex = indexOf(cell);
    if (primary[cellIndex] || secondary[cellIndex]) continue;
    markSecondary(cell);
    growSecondaryFrom(cell, primary, secondary, parent, markSecondary, addSegment);
  }

  loops += addRareSecondaryLoops(primary, secondary, segmentKeys, segments);
  const finalized = replaceSecondaryDeadEndsWithWalls(secondaryPoints, segments);

  return {
    points: finalized.points,
    segments: finalized.segments,
    wallPoints: finalized.wallPoints,
    wallKeys: finalized.wallKeys,
    secondaryCells: finalized.points.length,
    loops: finalized.loops
  };
}

function replaceSecondaryDeadEndsWithWalls(points, segments) {
  const pointKeys = new Set(points.map((point) => `${point.x},${point.y}`));
  const degree = new Map();

  for (const point of points) {
    degree.set(`${point.x},${point.y}`, 0);
  }

  for (const segment of segments) {
    for (const point of [segment.a, segment.b]) {
      const key = `${point.x},${point.y}`;
      if (pointKeys.has(key)) {
        degree.set(key, (degree.get(key) || 0) + 1);
      }
    }
  }

  const wallKeys = new Set();
  const wallPoints = [];

  for (const point of points) {
    const key = `${point.x},${point.y}`;
    if ((degree.get(key) || 0) === 1 && isXorCell(point.x, point.y)) {
      wallKeys.add(key);
      wallPoints.push(point);
    }
  }

  const filteredPoints = points.filter((point) => !wallKeys.has(`${point.x},${point.y}`));
  const filteredSegments = segments.filter((segment) => {
    const aKey = `${segment.a.x},${segment.a.y}`;
    const bKey = `${segment.b.x},${segment.b.y}`;
    return !wallKeys.has(aKey) && !wallKeys.has(bKey);
  });

  return {
    points: filteredPoints,
    segments: filteredSegments,
    wallPoints,
    wallKeys,
    loops: filteredSegments.filter((segment) => segment.isLoop).length
  };
}

function growSecondaryFrom(start, primary, secondary, parent, markSecondary, addSegment) {
  const stack = [start];

  while (stack.length) {
    const currentIndex = Math.random() < 0.82 ? stack.length - 1 : Math.floor(Math.random() * stack.length);
    const current = stack[currentIndex];
    const candidates = getNeighbors(current, true).filter((next) => {
      const nextIndex = indexOf(next);
      return !primary[nextIndex] && !secondary[nextIndex];
    });

    if (!candidates.length) {
      stack.splice(currentIndex, 1);
      continue;
    }

    const next = chooseSecondaryStep(current, candidates);
    const nextIndex = indexOf(next);
    markSecondary(next);
    parent[nextIndex] = indexOf(current);
    addSegment(current, next);
    stack.push(next);
  }
}

function chooseSecondaryStep(current, candidates) {
  return candidates
    .map((next) => {
      const keepsDirection =
        (next.x - current.x !== 0 && Math.random() < 0.6) ||
        (next.y - current.y !== 0 && Math.random() < 0.6);
      return {
        point: next,
        score: Math.random() + (keepsDirection ? 0.36 : 0)
      };
    })
    .sort((a, b) => b.score - a.score)[0].point;
}

function addRareSecondaryLoops(primary, secondary, segmentKeys, segments) {
  let added = 0;
  const maxLoops = Math.max(1, Math.floor(segments.length * 0.035));

  for (const cell of shuffleArray(getFreeCells())) {
    if (added >= maxLoops) break;
    const cellIndex = indexOf(cell);
    if (primary[cellIndex] || !secondary[cellIndex]) continue;

    for (const next of getNeighbors(cell, true)) {
      const nextIndex = indexOf(next);
      if (primary[nextIndex] || !secondary[nextIndex]) continue;
      if (segmentKeys.has(makeSegmentKey(cell, next))) continue;
      if (Math.random() > 0.035) continue;

      segmentKeys.add(makeSegmentKey(cell, next));
      segments.push({ a: cell, b: next, isLoop: true });
      added += 1;
      break;
    }
  }

  return added;
}

function resolveTargetLength(start, end, shortestLength) {
  const freeCount = getFreeCells().length;
  const requestedExtra = Math.floor((state.cols * state.rows * state.percent) / 100);
  const minimum = manhattan(start, end);
  const hardMinimum = Math.max(minimum, shortestLength);
  let requested = minimum + requestedExtra;
  let target = Math.min(requested, freeCount - 1);

  if ((target - minimum) % 2 !== 0) {
    target = target > hardMinimum ? target - 1 : target + 1;
  }

  target = Math.min(freeCount - 1, Math.max(hardMinimum, target));

  if ((target - minimum) % 2 !== 0) {
    target -= 1;
  }

  return {
    requested,
    target: Math.max(hardMinimum, target)
  };
}

function findPathAtOrBelowTarget(start, end, requestedTarget) {
  const shortest = bfsPath(start, end, null, true);
  if (!shortest) return null;

  const shortestLength = shortest.length - 1;
  if (requestedTarget <= shortestLength) {
    return {
      path: shortest,
      target: shortestLength,
      adjusted: requestedTarget !== shortestLength
    };
  }

  let best = null;
  let foundCount = 0;
  const isLargeGrid = state.cols * state.rows > 380;
  const maxFoundPaths = state.percent >= 35 ? (isLargeGrid ? 3 : 3) : 2;
  const targetStep = state.percent >= 35 ? 4 : 2;
  const maxTargetChecks = state.percent >= 35 ? (isLargeGrid ? 5 : 8) : (isLargeGrid ? 8 : 14);
  const targetStraight = state.percent >= 35 ? 6 : 8;

  for (
    let target = requestedTarget, checks = 0;
    target >= shortestLength && checks < maxTargetChecks;
    target -= targetStep, checks += 1
  ) {
    const path = findExactSimplePath(start, end, target);
    if (path) {
      const pathLength = path.length - 1;
      const quality = scoreCompletedPath(path) - pathLength * 0.06;
      const result = {
        path,
        target: pathLength,
        adjusted: target !== requestedTarget
      };

      foundCount += 1;
      if (!best || quality < best.quality) {
        best = { ...result, quality };
      }

      if (getMaxStraightInPath(path) <= targetStraight || foundCount >= maxFoundPaths) {
        const winner = getMaxStraightInPath(path) <= targetStraight ? result : best;
        return {
          path: winner.path,
          target: winner.target,
          adjusted: winner.adjusted || winner.target !== requestedTarget
        };
      }
    }
  }

  const flexible = findFlexibleScenicPath(start, end, requestedTarget);
  const minimumUsefulLength = Math.max(shortestLength + 8, Math.floor(requestedTarget * 0.45));

  if (flexible && (!best || best.target < minimumUsefulLength || scoreCompletedPath(flexible) < best.quality)) {
    return {
      path: flexible,
      target: flexible.length - 1,
      adjusted: flexible.length - 1 !== requestedTarget
    };
  }

  if (best) {
    return {
      path: best.path,
      target: best.target,
      adjusted: best.adjusted || best.target !== requestedTarget
    };
  }

  return {
    path: shortest,
    target: shortestLength,
    adjusted: requestedTarget !== shortestLength
  };
}

function findExactSimplePath(start, end, targetLength) {
  const total = state.cols * state.rows;
  const endIndex = indexOf(end);
  const isLargeGrid = total > 380;
  const timeBudget = Math.min(isLargeGrid ? 600 : 1100, (isLargeGrid ? 120 : 180) + targetLength * (isLargeGrid ? 3 : 7));
  const deadline = performance.now() + timeBudget;
  const maxVisits = Math.max(isLargeGrid ? 8000 : 14000, targetLength * state.cols * (isLargeGrid ? 5 : 9));
  let bestPath = null;
  let bestQuality = Infinity;

  for (let attempt = 0; attempt < (isLargeGrid ? 5 : 7); attempt += 1) {
    const visited = new Uint8Array(total);
    const path = [start];
    visited[indexOf(start)] = 1;
    let visits = 0;

    const search = (current, remaining) => {
      visits += 1;
      if (visits > maxVisits || performance.now() > deadline) return false;

      const currentIndex = indexOf(current);
      if (remaining === 0) return currentIndex === endIndex;
      if (currentIndex === endIndex) return false;

      const probe = bfsDistanceAndReachable(current, end, visited);
      if (probe.distance < 0) return false;
      if (probe.distance > remaining) return false;
      if ((remaining - probe.distance) % 2 !== 0) return false;
      if (probe.reachable < remaining + 1) return false;

      const candidates = getOrderedCandidates(current, end, visited, remaining, path, targetLength);
      for (const next of candidates) {
        const nextIndex = indexOf(next);
        if (nextIndex === endIndex && remaining !== 1) continue;
        if (visited[nextIndex]) continue;

        visited[nextIndex] = 1;
        path.push(next);

        if (search(next, remaining - 1)) return true;

        path.pop();
        visited[nextIndex] = 0;
      }

      return false;
    };

    if (search(start, targetLength)) {
      const candidate = path.slice();
      const quality = scoreCompletedPath(candidate);
      if (quality < bestQuality) {
        bestQuality = quality;
        bestPath = candidate;
      }
      if (quality <= getAcceptablePathQuality(candidate.length - 1)) {
        return candidate;
      }
    }
  }

  return bestPath;
}

function findFlexibleScenicPath(start, end, targetLength) {
  const total = state.cols * state.rows;
  const isLargeGrid = total > 380;
  const deadline = performance.now() + (isLargeGrid ? 520 : 900);
  let bestPath = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < (isLargeGrid ? 24 : 42) && performance.now() < deadline; attempt += 1) {
    const visited = new Uint8Array(total);
    const path = [start];
    visited[indexOf(start)] = 1;
    let current = start;

    while (path.length - 1 < targetLength && performance.now() < deadline) {
      const currentLength = path.length - 1;
      const remainingBudget = targetLength - currentLength;
      const connector = bfsPath(current, end, visited, true);
      if (!connector) break;
      if (remainingBudget <= connector.length) break;

      const candidates = getFlexibleCandidates(current, end, visited, path, remainingBudget, targetLength);
      if (!candidates.length) break;

      current = candidates[0];
      visited[indexOf(current)] = 1;
      path.push(current);
    }

    const connector = bfsPath(current, end, visited, true);
    if (!connector) continue;

    const candidate = path.concat(connector.slice(1));
    const candidateLength = candidate.length - 1;
    if (candidateLength > targetLength) continue;

    const lengthScore = candidateLength * 1.8 - Math.abs(targetLength - candidateLength) * 0.8;
    const qualityPenalty = scoreCompletedPath(candidate) * 1.35;
    const score = lengthScore - qualityPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestPath = candidate;
    }
  }

  return bestPath;
}

function getFlexibleCandidates(current, end, visited, path, remainingBudget, targetLength) {
  const scenicStrength = getScenicStrength(targetLength, path[0], current, end, remainingBudget);
  const straightRun = getStraightRun(path);
  const recentTurns = getRecentTurnCount(path, 7);
  const baseDistance = manhattan(current, end);

  return getNeighbors(current, true)
    .filter((next) => {
      const nextIndex = indexOf(next);
      if (visited[nextIndex] || samePoint(next, end)) return false;

      visited[nextIndex] = 1;
      const connector = bfsPath(next, end, visited, false);
      visited[nextIndex] = 0;

      return connector && connector.length - 1 <= remainingBudget - 1;
    })
    .map((next) => {
      const distance = manhattan(next, end);
      const awayBias = distance >= baseDistance && remainingBudget > 12 ? 0.22 : 0;
      const shapeBias = scorePathShape(next, current, path, visited, {
        scenicStrength,
        straightRun,
        recentTurns,
        remaining: remainingBudget
      });

      return {
        point: next,
        score: Math.random() + awayBias + shapeBias
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.point);
}

function scoreCompletedPath(path) {
  const maxStraight = getMaxStraightInPath(path);
  const closeContacts = countPathCloseContacts(path);
  const turnBursts = countTurnBursts(path);
  return maxStraight * 3.4 + closeContacts * 0.16 + turnBursts * 1.2;
}

function getAcceptablePathQuality(pathLength) {
  const targetMaxStraight = state.percent >= 35 ? 6 : 8;
  return targetMaxStraight * 3.4 + pathLength * 0.13;
}

function getMaxStraightInPath(path) {
  if (path.length < 2) return 0;

  let best = 1;
  let run = 1;
  let previous = getDirection(path[0], path[1]);

  for (let i = 2; i < path.length; i += 1) {
    const direction = getDirection(path[i - 1], path[i]);
    if (sameDirection(previous, direction)) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = direction;
  }

  return best;
}

function countPathCloseContacts(path) {
  const indexes = new Map();
  let contacts = 0;

  path.forEach((point, index) => {
    indexes.set(`${point.x},${point.y}`, index);
  });

  for (let i = 0; i < path.length; i += 1) {
    const point = path[i];
    const neighbors = [
      [point.x + 1, point.y],
      [point.x - 1, point.y],
      [point.x, point.y + 1],
      [point.x, point.y - 1]
    ];

    for (const [x, y] of neighbors) {
      const neighborIndex = indexes.get(`${x},${y}`);
      if (neighborIndex !== undefined && Math.abs(neighborIndex - i) > 5) {
        contacts += 1;
      }
    }
  }

  return contacts;
}

function countTurnBursts(path) {
  if (path.length < 5) return 0;

  let bursts = 0;
  for (let i = 3; i < path.length; i += 1) {
    const a = getDirection(path[i - 3], path[i - 2]);
    const b = getDirection(path[i - 2], path[i - 1]);
    const c = getDirection(path[i - 1], path[i]);
    if (!sameDirection(a, b) && !sameDirection(b, c)) {
      bursts += 1;
    }
  }

  return bursts;
}

function getOrderedCandidates(current, end, visited, remaining, path, targetLength) {
  const baseDistance = manhattan(current, end);
  const scenicStrength = getScenicStrength(targetLength, path[0], current, end, remaining);
  const straightRun = getStraightRun(path);
  const recentTurns = getRecentTurnCount(path, 7);

  return getNeighbors(current, true)
    .filter((next) => !visited[indexOf(next)] || samePoint(next, end))
    .map((next) => {
      const distance = manhattan(next, end);
      const drift = distance >= baseDistance ? 0.38 : 0;
      const finishBias = remaining < 12 ? -distance * 0.05 : 0;
      const shapeBias = scorePathShape(next, current, path, visited, {
        scenicStrength,
        straightRun,
        recentTurns,
        remaining
      });
      return {
        point: next,
        score: Math.random() + drift + finishBias + shapeBias
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.point);
}

function getScenicStrength(targetLength, pathStart, current, end, remaining) {
  const localSlack = remaining - manhattan(current, end);
  const totalSlack = targetLength - manhattan(pathStart || current, end);
  const percentStrength = clamp((state.percent - 5) / 30, 0, 1);
  const slackStrength = clamp(Math.min(localSlack, totalSlack) / 24, 0, 1);
  return Math.max(percentStrength, slackStrength * 0.85);
}

function getDirection(a, b) {
  return {
    x: Math.sign(b.x - a.x),
    y: Math.sign(b.y - a.y)
  };
}

function sameDirection(a, b) {
  return a.x === b.x && a.y === b.y;
}

function getStraightRun(path) {
  if (path.length < 2) return 0;

  let run = 1;
  let direction = getDirection(path[path.length - 2], path[path.length - 1]);

  for (let i = path.length - 2; i > 0; i -= 1) {
    const previous = getDirection(path[i - 1], path[i]);
    if (!sameDirection(previous, direction)) break;
    run += 1;
  }

  return run;
}

function getRecentTurnCount(path, windowSize) {
  if (path.length < 4) return 0;

  let turns = 0;
  const start = Math.max(2, path.length - windowSize);
  for (let i = start; i < path.length; i += 1) {
    const a = getDirection(path[i - 2], path[i - 1]);
    const b = getDirection(path[i - 1], path[i]);
    if (!sameDirection(a, b)) turns += 1;
  }

  return turns;
}

function scorePathShape(next, current, path, visited, options) {
  if (!options.scenicStrength || path.length < 2) return 0;

  const previousDirection = getDirection(path[path.length - 2], current);
  const nextDirection = getDirection(current, next);
  const keepsDirection = sameDirection(previousDirection, nextDirection);
  const nearbyVisited = countNearbyVisited(next, current, visited);
  let score = 0;

  if (keepsDirection) {
    const longRunPenalty = Math.max(0, options.straightRun - 2);
    score -= options.scenicStrength * (0.18 + longRunPenalty * 0.46);
    if (options.straightRun >= 5 && options.remaining > 8) {
      score -= options.scenicStrength * 0.9;
    }
  } else {
    const turnAfterUsefulRun = options.straightRun >= 2 && options.straightRun <= 5;
    score += options.scenicStrength * (turnAfterUsefulRun ? 0.52 : 0.14);
    if (options.recentTurns >= 3) {
      score -= options.scenicStrength * 0.48;
    }
  }

  if (nearbyVisited > 0 && options.remaining > 10) {
    score -= options.scenicStrength * Math.min(1.25, nearbyVisited * 0.24);
  }

  return score;
}

function countNearbyVisited(point, current, visited) {
  let count = 0;
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2]
  ];

  for (const [dx, dy] of offsets) {
    const neighbor = { x: point.x + dx, y: point.y + dy };
    if (!isInside(neighbor.x, neighbor.y) || samePoint(neighbor, current)) continue;
    if (visited[indexOf(neighbor)]) count += Math.abs(dx) + Math.abs(dy) === 1 ? 2 : 1;
  }

  return count;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getAnimationDelay() {
  return Math.round(clamp(260 - state.animationSpeed * 2.45, 10, 260));
}

function getMovementDelay() {
  return Math.round(clamp(96 - state.movementSpeed * 0.315, 1, 120));
}

function setAlgorithmControlDisabled(disabled) {
  controls.algorithm.disabled = disabled;
  if (!disabled) {
    controls.algorithm.value = "";
  }
}

function clearSearchAnimation() {
  state.animationRun += 1;
  state.isAnimating = false;
  state.temperature = new Map();
  state.temperatureMax = 0;
  state.bfsPath = [];
  state.aStarOpen = new Map();
  state.aStarClosed = new Map();
  state.aStarCurrent = null;
  state.aStarPath = [];
  state.biVisitedA = new Map();
  state.biVisitedB = new Map();
  state.biFrontA = new Set();
  state.biFrontB = new Set();
  state.biMeet = null;
  state.biPath = [];
  state.traveler = null;
  setAlgorithmControlDisabled(false);
}

function reconstructPath(previous, startIndex, endIndex) {
  const path = [];
  let walker = endIndex;

  while (walker !== -1) {
    path.push(pointFromIndex(walker));
    if (walker === startIndex) break;
    walker = previous[walker];
  }

  return path.reverse();
}

async function runBfsTemperatureAnimation() {
  syncStateFromControls();
  saveControls();

  if (!state.start || !state.end) {
    generate();
  }

  if (!state.start || !state.end || state.isAnimating) return;

  clearSearchAnimation();
  const runId = ++state.animationRun;
  state.isAnimating = true;
  setAlgorithmControlDisabled(true);
  state.message = "BFS: espalhando temperatura a partir de A";

  const total = state.cols * state.rows;
  const startIndex = indexOf(state.start);
  const endIndex = indexOf(state.end);
  const queue = [state.start];
  const visited = new Uint8Array(total);
  const distance = new Int32Array(total);
  const previous = new Int32Array(total);
  distance.fill(-1);
  previous.fill(-1);
  visited[startIndex] = 1;
  distance[startIndex] = 0;
  state.temperature.set(`${state.start.x},${state.start.y}`, 0);
  state.temperatureMax = 0;
  draw();

  let cursor = 0;
  let found = startIndex === endIndex;
  const delay = getAnimationDelay();

  while (cursor < queue.length && !found && runId === state.animationRun) {
    const layerEnd = queue.length;

    while (cursor < layerEnd) {
      const current = queue[cursor];
      const currentIndex = indexOf(current);
      cursor += 1;

      for (const next of getSearchNeighbors(current)) {
        const nextIndex = indexOf(next);
        if (visited[nextIndex]) continue;

        visited[nextIndex] = 1;
        previous[nextIndex] = currentIndex;
        distance[nextIndex] = distance[currentIndex] + 1;
        state.temperature.set(`${next.x},${next.y}`, distance[nextIndex]);
        state.temperatureMax = Math.max(state.temperatureMax, distance[nextIndex]);
        queue.push(next);

        if (nextIndex === endIndex) {
          found = true;
        }
      }
    }

    state.message = `BFS: camada ${state.temperatureMax} | visitadas ${state.temperature.size}`;
    draw();
    await sleep(delay);
  }

  if (runId !== state.animationRun) return;

  if (!found) {
    state.isAnimating = false;
    setAlgorithmControlDisabled(false);
    state.message = "BFS: B nao foi alcancado";
    draw();
    return;
  }

  state.bfsPath = reconstructPath(previous, startIndex, endIndex);
  state.message = `BFS: caminho encontrado com ${state.bfsPath.length - 1} passos`;
  draw();
  await sleep(Math.max(80, delay * 2));

  await animateTravelerOnPath(runId, state.bfsPath);
}

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function pointFromKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function getBestCheckpointNode(open) {
  let best = null;

  for (const node of open.values()) {
    if (
      !best ||
      node.h < best.h ||
      (node.h === best.h && node.turns < best.turns) ||
      (node.h === best.h && node.turns === best.turns && node.g > best.g) ||
      (node.h === best.h && node.turns === best.turns && node.g === best.g && Math.random() < 0.35)
    ) {
      best = node;
    }
  }

  return best;
}

function reconstructAStarPath(cameFrom, endKey) {
  const path = [];
  let walker = endKey;

  while (walker) {
    const [x, y] = walker.split(",").map(Number);
    path.push({ x, y });
    walker = cameFrom.get(walker);
  }

  return path.reverse();
}

async function runAStarAnimation() {
  syncStateFromControls();
  saveControls();

  if (!state.start || !state.end) {
    generate();
  }

  if (!state.start || !state.end || state.isAnimating) return;

  clearSearchAnimation();
  const runId = ++state.animationRun;
  state.isAnimating = true;
  setAlgorithmControlDisabled(true);
  state.message = "Greedy checkpoint: escolhendo o checkpoint com menor h";

  const startKey = pointKey(state.start);
  const endKey = pointKey(state.end);
  const open = new Map();
  const closed = new Map();
  const cameFrom = new Map();
  const triedFrom = new Map();
  const delay = getAnimationDelay();

  open.set(startKey, {
    ...state.start,
    g: 0,
    h: manhattan(state.start, state.end),
    f: manhattan(state.start, state.end),
    turns: 0
  });

  state.aStarOpen = new Map(open);
  state.aStarClosed = new Map();
  state.aStarPath = [];
  draw();

  let found = false;
  let iterations = 0;

  while (open.size && runId === state.animationRun) {
    const current = getBestCheckpointNode(open);
    const currentKey = pointKey(current);

    open.delete(currentKey);
    closed.set(currentKey, current);
    state.aStarCurrent = current;
    state.aStarOpen = new Map(open);
    state.aStarClosed = new Map(closed);
    iterations += 1;
    state.message = `Greedy: checkpoint ${currentKey} | h=${current.h} | abertos ${open.size} tentados ${closed.size}`;
    draw();
    await sleep(delay);

    if (currentKey === endKey) {
      found = true;
      break;
    }

    for (const next of getSearchNeighbors(current)) {
      const nextKey = pointKey(next);
      if (closed.has(nextKey)) continue;

      cameFrom.set(nextKey, currentKey);
      if (!triedFrom.has(currentKey)) triedFrom.set(currentKey, 0);
      triedFrom.set(currentKey, triedFrom.get(currentKey) + 1);
      const h = manhattan(next, state.end);
      const direction = getDirection(current, next);
      const previousDirection = cameFrom.get(currentKey)
        ? getDirection(pointFromKey(cameFrom.get(currentKey)), current)
        : direction;
      const turns = current.turns + (sameDirection(direction, previousDirection) ? 0 : 1);

      open.set(nextKey, {
        ...next,
        g: current.g + 1,
        h,
        f: h,
        turns
      });
    }

    state.aStarOpen = new Map(open);
    draw();
  }

  if (runId !== state.animationRun) return;

  if (!found) {
    state.isAnimating = false;
    setAlgorithmControlDisabled(false);
    state.message = "Greedy checkpoint: B nao foi alcancado";
    draw();
    return;
  }

  state.aStarPath = reconstructAStarPath(cameFrom, endKey);
  state.message = `Greedy checkpoint: caminho encontrado em ${state.aStarPath.length - 1} passos apos ${iterations} checkpoints`;
  draw();
  await sleep(Math.max(80, delay * 2));

  await animateTravelerOnPath(runId, state.aStarPath, "Greedy checkpoint: A chegou em B");
}

function reconstructBidirectionalPath(parentsA, parentsB, startKey, endKey, meetKey) {
  const startToMeet = [];
  let walker = meetKey;

  while (walker) {
    startToMeet.push(pointFromKey(walker));
    if (walker === startKey) break;
    walker = parentsA.get(walker);
  }

  startToMeet.reverse();

  const meetToEnd = [];
  walker = parentsB.get(meetKey);
  while (walker) {
    meetToEnd.push(pointFromKey(walker));
    if (walker === endKey) break;
    walker = parentsB.get(walker);
  }

  return startToMeet.concat(meetToEnd);
}

function expandBidirectionalFront(front, ownVisited, otherVisited, ownParents, depth) {
  const nextFront = new Set();
  let meetKey = null;

  for (const currentKey of front) {
    const current = pointFromKey(currentKey);

    for (const next of getSearchNeighbors(current)) {
      const nextKey = pointKey(next);
      if (ownVisited.has(nextKey)) continue;

      ownVisited.set(nextKey, {
        ...next,
        d: depth
      });
      ownParents.set(nextKey, currentKey);
      nextFront.add(nextKey);

      if (otherVisited.has(nextKey)) {
        meetKey = nextKey;
        break;
      }
    }

    if (meetKey) break;
  }

  return {
    front: nextFront,
    meetKey
  };
}

async function runBidirectionalBfsAnimation() {
  syncStateFromControls();
  saveControls();

  if (!state.start || !state.end) {
    generate();
  }

  if (!state.start || !state.end || state.isAnimating) return;

  clearSearchAnimation();
  const runId = ++state.animationRun;
  state.isAnimating = true;
  setAlgorithmControlDisabled(true);
  state.message = "Bidirectional BFS: duas ondas procurando o encontro";

  const startKey = pointKey(state.start);
  const endKey = pointKey(state.end);
  const visitedA = new Map([[startKey, { ...state.start, d: 0 }]]);
  const visitedB = new Map([[endKey, { ...state.end, d: 0 }]]);
  const parentsA = new Map();
  const parentsB = new Map();
  let frontA = new Set([startKey]);
  let frontB = new Set([endKey]);
  let meetKey = startKey === endKey ? startKey : null;
  let depthA = 0;
  let depthB = 0;
  const delay = getAnimationDelay();

  state.biVisitedA = new Map(visitedA);
  state.biVisitedB = new Map(visitedB);
  state.biFrontA = new Set(frontA);
  state.biFrontB = new Set(frontB);
  draw();

  while (!meetKey && frontA.size && frontB.size && runId === state.animationRun) {
    if (frontA.size <= frontB.size) {
      depthA += 1;
      const expanded = expandBidirectionalFront(frontA, visitedA, visitedB, parentsA, depthA);
      frontA = expanded.front;
      meetKey = expanded.meetKey;
    } else {
      depthB += 1;
      const expanded = expandBidirectionalFront(frontB, visitedB, visitedA, parentsB, depthB);
      frontB = expanded.front;
      meetKey = expanded.meetKey;
    }

    state.biVisitedA = new Map(visitedA);
    state.biVisitedB = new Map(visitedB);
    state.biFrontA = new Set(frontA);
    state.biFrontB = new Set(frontB);
    state.biMeet = meetKey ? pointFromKey(meetKey) : null;
    state.message = `Bidirectional BFS: A=${visitedA.size} B=${visitedB.size}${meetKey ? " | encontro" : ""}`;
    draw();
    await sleep(delay);
  }

  if (runId !== state.animationRun) return;

  if (!meetKey) {
    state.isAnimating = false;
    setAlgorithmControlDisabled(false);
    state.message = "Bidirectional BFS: encontro nao encontrado";
    draw();
    return;
  }

  state.biPath = reconstructBidirectionalPath(parentsA, parentsB, startKey, endKey, meetKey);
  state.biMeet = pointFromKey(meetKey);
  state.message = `Bidirectional BFS: encontro em ${meetKey} | caminho ${state.biPath.length - 1} passos`;
  draw();
  await sleep(Math.max(80, delay * 2));

  await animateTravelerOnPath(runId, state.biPath, "Bidirectional BFS: A chegou em B");
}

async function animateTravelerOnPath(runId, path, doneMessage = "BFS: A chegou em B") {
  if (!path.length) return;

  const stepDelay = getMovementDelay();
  state.message = "A caminhando ate B pelo caminho encontrado";

  for (let i = 0; i < path.length - 1 && runId === state.animationRun; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    const frames = state.movementSpeed >= 220
      ? 2
      : Math.max(3, Math.min(8, Math.floor(state.cellSize / 3)));

    for (let frame = 0; frame <= frames && runId === state.animationRun; frame += 1) {
      const t = frame / frames;
      state.traveler = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
      draw();
      await sleep(stepDelay);
    }
  }

  if (runId !== state.animationRun) return;

  state.traveler = state.end;
  state.isAnimating = false;
  setAlgorithmControlDisabled(false);
  state.message = doneMessage;
  draw();
}

function generate() {
  syncStateFromControls();
  saveControls();
  clearSearchAnimation();
  const pair = chooseRandomPair();

  if (!pair) {
    state.start = null;
    state.end = null;
    state.path = [];
    state.correctLoopSegments = [];
    state.secondaryPoints = [];
    state.secondarySegments = [];
    state.secondaryWallPoints = [];
    state.secondaryWallKeys = new Set();
    state.secondaryCells = 0;
    state.secondaryLoops = 0;
    state.correctLoops = 0;
    state.falseBranchStats = null;
    state.message = "nao encontrei dois pontos conectados";
    draw();
    return;
  }

  const shortestLength = pair.shortest.length - 1;
  const network = buildParallelMazeNetwork(pair.start, pair.end);

  state.start = pair.start;
  state.end = pair.end;
  state.path = network.path;
  state.correctLoopSegments = network.correctLoopSegments;
  state.correctLoops = network.correctLoops;
  state.falseBranchStats = network.falseBranchStats || null;
  state.secondaryPoints = network.secondaryPoints;
  state.secondarySegments = network.secondarySegments;
  state.secondaryWallPoints = network.secondaryWallPoints;
  state.secondaryWallKeys = network.secondaryWallKeys;
  state.secondaryCells = network.secondaryCells;
  state.secondaryLoops = network.secondaryLoops;
  state.shortestLength = shortestLength;
  state.requestedLength = state.path.length - 1;
  state.targetLength = state.path.length - 1;
  state.wasAdjusted = false;
  state.message = "rede paralela gerada: caminho certo em regioes amplas e ramos falsos longos";

  draw();
}

function resizeCanvas() {
  const width = state.cols * state.cellSize;
  const height = state.rows * state.cellSize;
  const dpr = window.devicePixelRatio || 1;
  controls.canvas.width = Math.ceil(width * dpr);
  controls.canvas.height = Math.ceil(height * dpr);
  controls.canvas.style.width = `${width}px`;
  controls.canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  resizeCanvas();

  const width = state.cols * state.cellSize;
  const height = state.rows * state.cellSize;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);

  drawCells();
  drawTemperature();
  drawAStarSearch();
  drawBidirectionalSearch();
  if (state.showLines) {
    drawSecondaryPaths();
    drawPath();
    drawCorrectLoops();
  }
  drawBfsPath();
  drawAStarPath();
  drawBidirectionalPath();
  drawPoints();
  drawTraveler();
  drawGridLines();
  updateReadout();
}

function drawCells() {
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const left = x * state.cellSize;
      const top = y * state.cellSize;

      if (isCertainWall(x, y) || state.secondaryWallKeys.has(`${x},${y}`)) {
        if (wallSprite.complete && wallSprite.naturalWidth > 0) {
          ctx.drawImage(wallSprite, left, top, state.cellSize, state.cellSize);
        } else {
          ctx.fillStyle = "#74695f";
          ctx.fillRect(left, top, state.cellSize, state.cellSize);
        }
      } else if ((x % 2 === 1) !== (y % 2 === 1)) {
        ctx.fillStyle = "#f0eadf";
        ctx.fillRect(left, top, state.cellSize, state.cellSize);
      }
    }
  }
}

function drawTemperature() {
  if (!state.temperature.size) return;

  ctx.save();

  for (const [key, distance] of state.temperature) {
    const [x, y] = key.split(",").map(Number);
    const ratio = state.temperatureMax ? distance / state.temperatureMax : 0;
    const hue = 205 - ratio * 165;
    const lightness = 68 - ratio * 18;
    ctx.fillStyle = `hsla(${hue}, 88%, ${lightness}%, 0.72)`;
    ctx.fillRect(x * state.cellSize, y * state.cellSize, state.cellSize, state.cellSize);
  }

  ctx.restore();
}

function drawAStarSearch() {
  if (!state.aStarOpen.size && !state.aStarClosed.size && !state.aStarCurrent) return;

  ctx.save();

  for (const node of state.aStarClosed.values()) {
    ctx.fillStyle = "rgba(90, 94, 104, 0.42)";
    ctx.fillRect(node.x * state.cellSize, node.y * state.cellSize, state.cellSize, state.cellSize);
  }

  for (const node of state.aStarOpen.values()) {
    const closeness = 1 - node.h / Math.max(1, manhattan(state.start, state.end));
    ctx.fillStyle = `hsla(${190 - closeness * 95}, 86%, ${62 - closeness * 18}%, 0.62)`;
    ctx.fillRect(node.x * state.cellSize, node.y * state.cellSize, state.cellSize, state.cellSize);
  }

  if (state.aStarCurrent) {
    const node = state.aStarCurrent;
    ctx.fillStyle = "rgba(255, 171, 46, 0.9)";
    ctx.fillRect(node.x * state.cellSize, node.y * state.cellSize, state.cellSize, state.cellSize);
  }

  if (state.cellSize >= 18) {
    ctx.font = `700 ${Math.max(7, Math.floor(state.cellSize * 0.25))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const node of [...state.aStarOpen.values(), ...state.aStarClosed.values()]) {
      const x = node.x * state.cellSize + state.cellSize / 2;
      const top = node.y * state.cellSize;
      ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
      ctx.fillText(`h${node.h}`, x, top + state.cellSize * 0.33);
      ctx.fillText(`d${node.g}`, x, top + state.cellSize * 0.68);
    }
  }

  ctx.restore();
}

function drawBidirectionalSearch() {
  if (!state.biVisitedA.size && !state.biVisitedB.size) return;

  ctx.save();

  for (const node of state.biVisitedA.values()) {
    ctx.fillStyle = "rgba(46, 126, 220, 0.46)";
    ctx.fillRect(node.x * state.cellSize, node.y * state.cellSize, state.cellSize, state.cellSize);
  }

  for (const node of state.biVisitedB.values()) {
    ctx.fillStyle = "rgba(220, 78, 154, 0.46)";
    ctx.fillRect(node.x * state.cellSize, node.y * state.cellSize, state.cellSize, state.cellSize);
  }

  for (const key of state.biFrontA) {
    const point = pointFromKey(key);
    ctx.fillStyle = "rgba(21, 99, 214, 0.82)";
    ctx.fillRect(point.x * state.cellSize, point.y * state.cellSize, state.cellSize, state.cellSize);
  }

  for (const key of state.biFrontB) {
    const point = pointFromKey(key);
    ctx.fillStyle = "rgba(202, 41, 139, 0.82)";
    ctx.fillRect(point.x * state.cellSize, point.y * state.cellSize, state.cellSize, state.cellSize);
  }

  if (state.biMeet) {
    ctx.fillStyle = "rgba(255, 218, 58, 0.94)";
    ctx.fillRect(state.biMeet.x * state.cellSize, state.biMeet.y * state.cellSize, state.cellSize, state.cellSize);
  }

  ctx.restore();
}

function drawGridLines() {
  const width = state.cols * state.cellSize;
  const height = state.rows * state.cellSize;
  ctx.beginPath();
  ctx.strokeStyle = "rgba(117, 111, 102, 0.3)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= state.cols; x += 1) {
    const px = x * state.cellSize + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
  }

  for (let y = 0; y <= state.rows; y += 1) {
    const py = y * state.cellSize + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
  }

  ctx.stroke();
}

function drawSecondaryPaths() {
  if (!state.secondaryPoints.length && !state.secondarySegments.length) return;

  ctx.save();

  if (state.secondaryPoints.length) {
    const markerSize = Math.max(2, state.cellSize * 0.22);
    ctx.fillStyle = "rgba(209, 47, 47, 0.46)";
    for (const point of state.secondaryPoints) {
      const x = point.x * state.cellSize + state.cellSize / 2 - markerSize / 2;
      const y = point.y * state.cellSize + state.cellSize / 2 - markerSize / 2;
      ctx.fillRect(x, y, markerSize, markerSize);
    }
  }

  ctx.beginPath();
  for (const segment of state.secondarySegments) {
    const ax = segment.a.x * state.cellSize + state.cellSize / 2;
    const ay = segment.a.y * state.cellSize + state.cellSize / 2;
    const bx = segment.b.x * state.cellSize + state.cellSize / 2;
    const by = segment.b.y * state.cellSize + state.cellSize / 2;
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.strokeStyle = "#d12f2f";
  ctx.lineWidth = Math.max(1.2, Math.min(2.5, state.cellSize * 0.14));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.82;
  ctx.stroke();
  ctx.restore();
}

function drawPath() {
  if (!state.path || state.path.length < 2) return;

  ctx.save();
  ctx.beginPath();
  state.path.forEach((point, index) => {
    const x = point.x * state.cellSize + state.cellSize / 2;
    const y = point.y * state.cellSize + state.cellSize / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#1d4f8f";
  ctx.lineWidth = Math.max(1.5, Math.min(3, state.cellSize * 0.16));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawCorrectLoops() {
  if (!state.correctLoopSegments.length) return;

  ctx.save();
  ctx.beginPath();
  for (const segment of state.correctLoopSegments) {
    const ax = segment.a.x * state.cellSize + state.cellSize / 2;
    const ay = segment.a.y * state.cellSize + state.cellSize / 2;
    const bx = segment.b.x * state.cellSize + state.cellSize / 2;
    const by = segment.b.y * state.cellSize + state.cellSize / 2;
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.strokeStyle = "rgba(29, 79, 143, 0.72)";
  ctx.lineWidth = Math.max(1.3, Math.min(2.4, state.cellSize * 0.13));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawBfsPath() {
  if (!state.bfsPath || state.bfsPath.length < 2) return;

  ctx.save();
  ctx.beginPath();
  state.bfsPath.forEach((point, index) => {
    const x = point.x * state.cellSize + state.cellSize / 2;
    const y = point.y * state.cellSize + state.cellSize / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#ffda3a";
  ctx.lineWidth = Math.max(2.4, Math.min(5, state.cellSize * 0.26));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.95;
  ctx.stroke();

  ctx.strokeStyle = "rgba(55, 41, 9, 0.58)";
  ctx.lineWidth = Math.max(1.1, Math.min(2.1, state.cellSize * 0.1));
  ctx.stroke();
  ctx.restore();
}

function drawAStarPath() {
  if (!state.aStarPath || state.aStarPath.length < 2) return;

  ctx.save();
  ctx.beginPath();
  state.aStarPath.forEach((point, index) => {
    const x = point.x * state.cellSize + state.cellSize / 2;
    const y = point.y * state.cellSize + state.cellSize / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#fff064";
  ctx.lineWidth = Math.max(2.7, Math.min(5.5, state.cellSize * 0.3));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.strokeStyle = "rgba(120, 76, 8, 0.68)";
  ctx.lineWidth = Math.max(1.1, Math.min(2.2, state.cellSize * 0.11));
  ctx.stroke();
  ctx.restore();
}

function drawBidirectionalPath() {
  if (!state.biPath || state.biPath.length < 2) return;

  ctx.save();
  ctx.beginPath();
  state.biPath.forEach((point, index) => {
    const x = point.x * state.cellSize + state.cellSize / 2;
    const y = point.y * state.cellSize + state.cellSize / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#62f08f";
  ctx.lineWidth = Math.max(2.7, Math.min(5.5, state.cellSize * 0.3));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.strokeStyle = "rgba(19, 88, 44, 0.68)";
  ctx.lineWidth = Math.max(1.1, Math.min(2.2, state.cellSize * 0.11));
  ctx.stroke();
  ctx.restore();
}

function drawPoints() {
  if (state.start && !state.traveler) drawMarker(state.start, "#2f7d68", "A");
  if (state.end) drawMarker(state.end, "#b84a3b", "B");
}

function drawTraveler() {
  if (!state.traveler) return;
  drawMarker(state.traveler, "#2f7d68", "A");
}

function drawMarker(point, color, label) {
  const radius = Math.max(4, state.cellSize * 0.35);
  const x = point.x * state.cellSize + state.cellSize / 2;
  const y = point.y * state.cellSize + state.cellSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fffdf8";
  ctx.stroke();

  if (state.cellSize >= 14) {
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.max(9, Math.floor(state.cellSize * 0.52))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 0.3);
  }
  ctx.restore();
}

function updateReadout() {
  controls.gridReadout.textContent = `x: ${state.cols} g | y: ${state.rows} g | g: ${state.cellSize}px`;

  if (!state.path.length) {
    controls.pathReadout.textContent = "caminho: aguardando gerar";
  } else {
    const actual = state.path.length - 1;
    const adjusted = state.wasAdjusted ? " | ajustado" : "";
    const branchSummary = state.falseBranchStats
      ? ` | ramo max: ${state.falseBranchStats.maxDepth} | longos: ${state.falseBranchStats.longBranchCount}/${state.falseBranchStats.nearEndLongBranchCount}`
      : "";
    controls.pathReadout.textContent = `min: ${state.shortestLength} | final: ${actual}${adjusted} | falsos: ${state.secondaryCells} g | walls: ${state.secondaryWallPoints.length}${branchSummary}`;
  }

  controls.statusReadout.textContent = state.message;
}

controls.generate.addEventListener("click", generate);

controls.algorithm.addEventListener("change", () => {
  const selected = controls.algorithm.value;
  if (selected === "bfs") runBfsTemperatureAnimation();
  if (selected === "greedy") runAStarAnimation();
  if (selected === "bibfs") runBidirectionalBfsAnimation();
});

controls.showLines.addEventListener("change", () => {
  syncStateFromControls();
  saveControls();
  draw();
});

for (const input of [controls.cellSize, controls.width, controls.height]) {
  input.addEventListener("change", () => {
    syncStateFromControls();
    saveControls();
    clearSearchAnimation();
    state.path = [];
    state.correctLoopSegments = [];
    state.secondaryPoints = [];
    state.secondarySegments = [];
    state.secondaryWallPoints = [];
    state.secondaryWallKeys = new Set();
    state.secondaryCells = 0;
    state.secondaryLoops = 0;
    state.correctLoops = 0;
    state.falseBranchStats = null;
    state.start = null;
    state.end = null;
    state.message = "configuracao atualizada";
    draw();
  });
}

controls.percent.addEventListener("input", () => {
  syncStateFromControls();
  saveControls();
  controls.percentValue.value = `${controls.percent.value}%`;
});

controls.animationSpeed.addEventListener("input", () => {
  syncStateFromControls();
  saveControls();
  controls.animationSpeedValue.value = `${controls.animationSpeed.value}`;
});

controls.movementSpeed.addEventListener("input", () => {
  syncStateFromControls();
  saveControls();
  controls.movementSpeedValue.value = `${controls.movementSpeed.value}`;
});

wallSprite.addEventListener("load", draw);
loadSavedControls();
syncStateFromControls();
draw();

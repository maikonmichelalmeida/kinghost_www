"use strict";

function key(point) {
  return `${point.x},${point.y}`;
}

function pointFromKey(value) {
  const [x, y] = value.split(",").map(Number);
  return { x, y };
}

function getNeighbors(point, cols, rows, walls) {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 }
  ].filter((next) => (
    next.x >= 0 &&
    next.y >= 0 &&
    next.x < cols &&
    next.y < rows &&
    !walls.has(key(next))
  ));
}

function expandFront(front, ownVisited, otherVisited, ownParents, depth, cols, rows, walls) {
  const nextFront = new Set();
  let meetKey = null;

  for (const currentKey of front) {
    const current = pointFromKey(currentKey);

    for (const next of getNeighbors(current, cols, rows, walls)) {
      const nextKey = key(next);
      if (ownVisited.has(nextKey)) continue;

      ownVisited.set(nextKey, { ...next, d: depth });
      ownParents.set(nextKey, currentKey);
      nextFront.add(nextKey);

      if (otherVisited.has(nextKey)) {
        meetKey = nextKey;
      }
    }
  }

  return { front: nextFront, meetKey };
}

function reconstructPath(parentsA, parentsB, startKey, endKey, meetKey) {
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

function snapshotMap(map) {
  return Array.from(map.values());
}

self.onmessage = (event) => {
  const { cols, rows, start, end, wallKeys } = event.data;
  const walls = new Set(wallKeys);
  const startKey = key(start);
  const endKey = key(end);
  const visitedA = new Map([[startKey, { ...start, d: 0 }]]);
  const visitedB = new Map([[endKey, { ...end, d: 0 }]]);
  const parentsA = new Map();
  const parentsB = new Map();
  let frontA = new Set([startKey]);
  let frontB = new Set([endKey]);
  let meetKey = startKey === endKey ? startKey : null;
  let depthA = 0;
  let depthB = 0;
  const frames = [];

  frames.push({
    visitedA: snapshotMap(visitedA),
    visitedB: snapshotMap(visitedB),
    frontA: Array.from(frontA),
    frontB: Array.from(frontB),
    meet: meetKey ? pointFromKey(meetKey) : null
  });

  while (!meetKey && frontA.size && frontB.size) {
    depthA += 1;
    const expandedA = expandFront(frontA, visitedA, visitedB, parentsA, depthA, cols, rows, walls);
    frontA = expandedA.front;
    meetKey = expandedA.meetKey;

    if (!meetKey) {
      depthB += 1;
      const expandedB = expandFront(frontB, visitedB, visitedA, parentsB, depthB, cols, rows, walls);
      frontB = expandedB.front;
      meetKey = expandedB.meetKey;
    }

    frames.push({
      visitedA: snapshotMap(visitedA),
      visitedB: snapshotMap(visitedB),
      frontA: Array.from(frontA),
      frontB: Array.from(frontB),
      meet: meetKey ? pointFromKey(meetKey) : null
    });
  }

  self.postMessage({
    frames,
    path: meetKey ? reconstructPath(parentsA, parentsB, startKey, endKey, meetKey) : [],
    meet: meetKey ? pointFromKey(meetKey) : null
  });
};

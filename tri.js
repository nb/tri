const GRID_SIZE = 1000;
const LINE_LENGTH_MIN = 20;
const LINE_LENGTH_MAX = 50;
const DELAY = 200;
const MAX_ATTEMPTS = 1000000;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#eee";
ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
let shouldStop = false;
let attempts = 0;

function drawSegment([{ x: x0, y: y0 }, { x: x1, y: y1 }], style = "black") {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = style;
  ctx.stroke();
}

// thanks MDN
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export function deepEqual(x, y) {
  if (x === y) {
    return true;
  } else if (
    typeof x == "object" &&
    x != null &&
    (typeof y == "object" && y != null)
  ) {
    if (Object.keys(x).length != Object.keys(y).length) return false;

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) return false;
      } else return false;
    }

    return true;
  } else return false;
}

function randomPoint() {
  const r = () => getRandomInt(0, GRID_SIZE);
  return { x: r(), y: r() };
}

function randomPointCloseToASegment(segment, predicate = point => true) {
  let newPoint,
    angle,
    offsetX,
    offsetY,
    sign = Math.random() > 0.5 ? -1 : 1,
    pointAttempts = 0;
  const middle = middleOfASegment(segment);
  const diffX = segment[0].x - segment[1].x;
  const diffY = segment[0].y - segment[1].y;
  const slopeAngle = Math.atan2(diffY, diffX);
  /*
  ctx.fillStyle = "green";
  ctx.fillRect(middle.x, middle.y, 3, 3);
  */
  const equiHeight = (Math.sqrt(3) * segmentLength(segment)) / 2;
  let distance = getRandomInt(0.9 * equiHeight, 1.1 * equiHeight);
  do {
    pointAttempts++;
    if (pointAttempts > 100) return false;
    angle = Math.random() * 2 * Math.PI;
    angle = ((70 + Math.random() * 40) / 180) * Math.PI + slopeAngle;
    offsetX = Math.cos(angle) * distance;
    offsetY = Math.sin(angle) * distance;
    newPoint = {
      x: Math.floor(middle.x + sign * offsetX),
      y: Math.floor(middle.y + sign * offsetY)
    };
    distance = distance / 1.1;
    sign = -sign;
  } while (
    newPoint.x < 0 ||
    newPoint.y < 0 ||
    newPoint.x >= GRID_SIZE ||
    newPoint.y >= GRID_SIZE ||
    !predicate(newPoint)
  );
  return newPoint;
}

function randomSegment() {
  let segment = [],
    len;
  do {
    segment = [randomPoint(), randomPoint()];
    len = segmentLength(segment);
  } while (len <= LINE_LENGTH_MIN || len >= LINE_LENGTH_MAX);
  return segment;
}

function segmentLength(segment) {
  return Math.sqrt(
    (segment[0].x - segment[1].x) * (segment[0].x - segment[1].x) +
      (segment[0].y - segment[1].y) * (segment[0].y - segment[1].y)
  );
}

/**
 * Orientation of three points – a segment and one more point
 * 0: colinear, 1: clock wise, 1: counterclockwise (or vice versa, whatever…)
 */
function orientation([p0, p1], p2) {
  const wild = (p2.x - p1.x) * (p1.y - p0.y) - (p1.x - p0.x) * (p2.y - p1.y);
  const sign = wild === 0 ? 0 : wild < 0 ? -1 : 1;
  return sign;
}

function isPointOnSegment(point, segment) {
  return (
    point.x <= Math.max(segment[0].x, segment[1].x) &&
    point.x >= Math.min(segment[0].x, segment[1].x) &&
    point.y <= Math.max(segment[0].y, segment[1].y) &&
    point.y >= Math.min(segment[0].y, segment[1].y)
  );
}

function isPointInsidePolygon(point, segments) {
  const toFarAway = [point, { x: 100000, y: 100000 }];
  let crossings = 0;
  for (const segment of segments) {
    if (orientation(segment, point) === 0) {
      return true;
    }
    if (doSegmentsCross(segment, toFarAway)) {
      crossings += 1;
    }
  }
  return crossings % 2 === 1;
}

function randomTriangle() {
  const side = randomSegment();
  let point;
  do {
    point = randomPointCloseToASegment(side);
  } while (orientation(side, point) === 0);
  return [side, [side[0], point], [side[1], point]];
}

export function doSegmentsCross(segment0, segment1) {
  const orientationSeg0Point0 = orientation(segment0, segment1[0]),
    orientationSeg0Point1 = orientation(segment0, segment1[1]),
    orientationSeg1Point0 = orientation(segment1, segment0[0]),
    orientationSeg1Point1 = orientation(segment1, segment0[1]);
  if (
    orientationSeg0Point0 != orientationSeg0Point1 &&
    orientationSeg1Point0 != orientationSeg1Point1
  ) {
    return true;
  }
  // special cases, when all points are on the same line
  if (orientationSeg0Point0 == 0 && isPointOnSegment(segment1[0], segment0)) {
    return true;
  }
  if (orientationSeg0Point1 == 0 && isPointOnSegment(segment1[1], segment0)) {
    return true;
  }
  if (orientationSeg1Point0 == 0 && isPointOnSegment(segment0[0], segment1)) {
    return true;
  }
  if (orientationSeg1Point1 == 0 && isPointOnSegment(segment0[1], segment1)) {
    // this shouldn't be reachable, but for good measure
    return true;
  }
  return false;
}

/**
 * Orders a list of segments so that they now
 * make a valid polygon – end of each segment is the start of the next
 * @param {Array} segments
 */
export function orderSegments(segments) {
  if (segments.length < 2) {
    return segments;
  }
  const length = segments.length;
  const ordered = [];
  let current = segments[0][1];
  let swap;
  let foundIndex;
  ordered.push(segments[0]);
  segments.shift();
  while (ordered.length < length) {
    foundIndex = false;
    swap = false;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (deepEqual(segment[0], current)) {
        foundIndex = i;
        swap = false;
        break;
      }
      if (deepEqual(segment[1], current)) {
        foundIndex = i;
        swap = true;
        break;
      }
    }
    if (false === foundIndex) {
      throw "Could not find a segment starting/ending with " +
        JSON.stringify(current);
    }
    if (swap) {
      current = segments[foundIndex][0];
      ordered.push([segments[foundIndex][1], segments[foundIndex][0]]);
    } else {
      current = segments[foundIndex][1];
      ordered.push(segments[foundIndex]);
    }
    segments.splice(foundIndex, 1);
  }
  return ordered;
}

export function firstConcaveEdge(segments) {
  let firstPlus = -1,
    firstMinus = -1,
    countPlus = 0,
    countMinus = 0,
    j;
  for (let i = 0; i < segments.length; i++) {
    j = (i + 1) % segments.length;
    if (orientation(segments[i], segments[j][1]) > 0) {
      countPlus++;
      if (-1 === firstPlus) firstPlus = i;
    } else {
      countMinus++;
      if (-1 === firstMinus) firstMinus = i;
    }
  }
  if (countPlus === 0 || countMinus === 0) {
    return false;
  }
  if (countPlus > countMinus) {
    return firstMinus;
  } else if (countMinus > countPlus) {
    return firstPlus;
  } else {
    throw "equal pluses and minuses :(";
  }
}

function middleOfASegment(segment) {
  return {
    x: Math.floor((segment[0].x + segment[1].x) / 2),
    y: Math.floor((segment[0].y + segment[1].y) / 2)
  };
}

function replaceSideWithNewPoint(segmentIndex, point, segments) {
  const newSegment0 = [segments[segmentIndex][0], point];
  const newSegment1 = [point, segments[segmentIndex][1]];
  segments.splice(segmentIndex, 1, newSegment0, newSegment1);
  drawSegment(newSegment0);
  drawSegment(newSegment1);
  return segments;
}

function doesNewTriangleOverlapWithPolygon(point, segmentIndex, segments) {
  const newSegments = [
    [segments[segmentIndex][0], point],
    [point, segments[segmentIndex][1]]
  ];
  for (let i = 0; i < segments.length; i++) {
    if (i === segmentIndex) {
      continue;
    }
    if (
      i !== (segmentIndex - 1 + segments.length) % segments.length &&
      doSegmentsCross(newSegments[0], segments[i])
    ) {
      return true;
    }
    if (
      i !== (segmentIndex + 1) % segments.length &&
      doSegmentsCross(newSegments[1], segments[i])
    ) {
      return true;
    }
  }
  return false;
}

function next(segments) {
  attempts++;
  if (shouldStop || attempts > MAX_ATTEMPTS) {
    return;
  }
  // random segment
  const segmentIndex = getRandomInt(0, segments.length);
  const startSegment = segments[segmentIndex];
  const newPoint = randomPointCloseToASegment(startSegment, point => {
    return (
      !isPointInsidePolygon(point, segments) &&
      !doesNewTriangleOverlapWithPolygon(point, segmentIndex, segments)
    );
  });
  if (false === newPoint) {
    const firstConcave = firstConcaveEdge(segments);
    if (false !== firstConcave) {
      const afterConcave = (firstConcave + 1) % segments.length;
      drawSegment([segments[firstConcave][0], segments[afterConcave][1]]);
      segments[firstConcave][1] = segments[afterConcave][1];
      segments.splice(afterConcave, 1);
      setTimeout(() => next(segments), DELAY);
      return;
    }
    setTimeout(() => next(segments), 0);
    return;
  }
  segments = replaceSideWithNewPoint(segmentIndex, newPoint, segments);
  setTimeout(() => next(segments), DELAY);
}

document.onkeydown = function(event) {
  if (event.key === "Esc" || event.key === "Escape") {
    shouldStop = true;
  }
};

const initialSegments = orderSegments(randomTriangle());
initialSegments.forEach(drawSegment);
next(initialSegments);

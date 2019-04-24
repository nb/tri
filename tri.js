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

function deepEqual(x, y) {
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
    /*
    ctx.fillStyle = "red";
    ctx.fillRect(newPoint.x, newPoint.y, 3, 3);
    */
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

function doSegmentsCross(segment0, segment1) {
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

function orderSegments(segments) {
  if (segments.length < 2) {
    return segments;
  }
  const length = segments.length;
  const ordered = [];
  let current = segments[0][1];
  let rotate;
  let foundIndex;
  ordered.push(segments[0]);
  segments.shift();
  while (ordered.length < length) {
    // find a segment starting with the current point
    foundIndex = false;
    rotate = false;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (deepEqual(segment[0], current)) {
        foundIndex = i;
        rotate = false;
        break;
      }
      if (deepEqual(segment[1], current)) {
        foundIndex = i;
        rotate = true;
        break;
      }
    }
    if (false === foundIndex) {
      throw "Could not find a segment starting/ending with " +
        JSON.stringify(current);
    }
    if (rotate) {
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

function firstConcaveEdge(segments) {
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

function tests() {
  const crossTests = [
    [
      "simple cross",
      true,
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 0, y: 100 }, { x: 100, y: 0 }]
    ],
    [
      "simple not cross",
      false,
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 520, y: 550 }, { x: 589, y: 611 }]
    ],
    [
      "all on same line, point 2 inside",
      true,
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 90, y: 90 }, { x: 200, y: 200 }]
    ],
    [
      "all on same line, point 3 inside",
      true,
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 200, y: 200 }, { x: 90, y: 90 }]
    ],
    [
      "all on same line, point 0 inside",
      true,
      [{ x: 90, y: 90 }, { x: 95, y: 95 }],
      [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    ],
    [
      "all on same line, point 1 inside",
      true,
      [{ x: 500, y: 500 }, { x: 90, y: 90 }],
      [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    ],
    [
      "all on same line apart",
      false,
      [{ x: 200, y: 200 }, { x: 110, y: 110 }],
      [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    ]
  ];
  const orderTests = [
    [
      "ordered triangle stays the same",
      [
        [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        [{ x: 100, y: 100 }, { x: 100, y: 0 }],
        [{ x: 100, y: 0 }, { x: 0, y: 0 }]
      ],
      [
        [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        [{ x: 100, y: 100 }, { x: 100, y: 0 }],
        [{ x: 100, y: 0 }, { x: 0, y: 0 }]
      ]
    ],
    [
      "a point in the wrong direction is swapped",
      [
        [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        [{ x: 100, y: 0 }, { x: 100, y: 100 }],
        [{ x: 100, y: 0 }, { x: 0, y: 0 }]
      ],
      [
        [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        [{ x: 100, y: 100 }, { x: 100, y: 0 }],
        [{ x: 100, y: 0 }, { x: 0, y: 0 }]
      ]
    ]
  ];
  const firstConcaveEdgeTests = [
    [
      "it's convex",
      false,
      [
        [{ x: 300, y: 100 }, { x: 420, y: 10 }],
        [{ x: 420, y: 10 }, { x: 510, y: 220 }],
        [{ x: 510, y: 220 }, { x: 320, y: 280 }],
        [{ x: 320, y: 280 }, { x: 300, y: 100 }]
      ]
    ],
    [
      "last segment is concave",
      3,
      [
        [{ x: 100, y: 100 }, { x: 0, y: 200 }],
        [{ x: 0, y: 200 }, { x: 0, y: 0 }],
        [{ x: 0, y: 0 }, { x: 200, y: 100 }],
        [{ x: 200, y: 100 }, { x: 100, y: 100 }]
      ]
    ]
  ];
  crossTests.forEach(test =>
    console.assert(test[1] === doSegmentsCross(test[2], test[3]), test[0])
  );
  orderTests.forEach(test =>
    console.assert(deepEqual(test[2], orderSegments(test[1])), test[0])
  );
  firstConcaveEdgeTests.forEach(test =>
    console.assert(deepEqual(test[1], firstConcaveEdge(test[2])), test[0])
  );
}
tests();

function middleOfASegment(segment) {
  return {
    x: Math.floor((segment[0].x + segment[1].x) / 2),
    y: Math.floor((segment[0].y + segment[1].y) / 2)
  };
}

function isPointAloneOnItsSide(point, startSegment, segments) {
  const newPointOrientation = orientation(startSegment, point);
  for (const segment of segments) {
    if (orientation(segment, point) === 0) {
      console.log("New point is on a segment.", newPoint, segment);
      return false;
    }
    if (
      orientation(startSegment, segment[0]) * newPointOrientation === 1 ||
      orientation(startSegment, segment[1]) * newPointOrientation === 1
    ) {
      console.log(
        "New point is on the same side of the chosen segment with another point",
        point,
        segment
      );
      return false;
    }
  }
  return true;
}

function next(segments) {
  if (shouldStop) {
    return;
  }
  attempts++;
  if (attempts > MAX_ATTEMPTS) {
    return;
  }
  // random segment
  const segmentIndex = getRandomInt(0, segments.length);
  const startSegment = segments[segmentIndex];
  const newPoint = randomPointCloseToASegment(startSegment, point => {
    return (
      !isPointInsidePolygon(point, segments) &&
      isPointAloneOnItsSide(point, startSegment, segments)
    );
  });
  if (false === newPoint) {
    setTimeout(() => next(segments), 0);
    return;
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

  const newSegment0 = [startSegment[0], newPoint];
  const newSegment1 = [newPoint, startSegment[1]];
  segments.splice(segmentIndex, 1, newSegment0, newSegment1);
  drawSegment(newSegment0);
  drawSegment(newSegment1);
  setTimeout(() => next(segments), DELAY);
}

document.onkeydown = function(event) {
  if (event.key === "Esc" || event.key === "Escape") {
    shouldStop = true;
  }
};

const triangle = [
  [{ x: 741, y: 380 }, { x: 300, y: 572 }],
  [{ x: 741, y: 380 }, { x: 741, y: 963 }],
  [{ x: 300, y: 572 }, { x: 741, y: 963 }]
];
//const initialSegments = orderSegments(triangle);
const initialSegments = orderSegments(randomTriangle());
initialSegments.forEach(drawSegment);
next(initialSegments);

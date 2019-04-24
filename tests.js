import {
  orderSegments,
  firstConcaveEdge,
  doSegmentsCross,
  deepEqual
} from "./tri.js";

function tests() {
  const crossTests = [
    [
      "simple cross",
      true,
      [{ x: 1, y: 0 }, { x: 100, y: 100 }],
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

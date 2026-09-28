
// ==========================================
// AlgoViz - Graph Builder + Dijkstra
// ==========================================

let graph = {};
let result = null;
let currentStep = 0;
let playing = false;
let timer = null;


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const nodeInput = document.getElementById("nodeInput");
const addNodeBtn = document.getElementById("addNodeBtn");

const fromNode = document.getElementById("fromNode");
const toNode = document.getElementById("toNode");

const weightInput = document.getElementById("weightInput");
const addEdgeBtn = document.getElementById("addEdgeBtn");

const startNode = document.getElementById("startNode");
const endNode = document.getElementById("endNode");

const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");

const edgeList = document.getElementById("edgeList");
const message = document.getElementById("message");

const graphSvg = document.getElementById("graphSvg");

const backBtn = document.getElementById("backBtn");
const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");


// ==========================================
// ADD NODE
// ==========================================

addNodeBtn.addEventListener("click", addNode);

function addNode() {

    const node = nodeInput.value.trim();

    if (!node) {
        showMessage("Please enter a node name.", "error");
        return;
    }

    if (graph[node]) {
        showMessage(`Node "${node}" already exists.`, "error");
        return;
    }

    // Create node
    graph[node] = [];

    nodeInput.value = "";

    updateDropdowns();
    updateEdgeList();
    drawGraph();

    showMessage(`Node "${node}" added successfully.`, "success");
}


// Allow Enter key to add node
nodeInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        addNode();
    }

});


// ==========================================
// ADD EDGE
// ==========================================

addEdgeBtn.addEventListener("click", addEdge);

function addEdge() {

    const from = fromNode.value;
    const to = toNode.value;
    const weight = Number(weightInput.value);

    if (!from || !to) {
        showMessage("Please select both nodes.", "error");
        return;
    }

    if (from === to) {
        showMessage("A node cannot connect to itself.", "error");
        return;
    }

    if (weightInput.value === "" || weight < 0) {
        showMessage("Please enter a valid non-negative weight.", "error");
        return;
    }

    // Check if edge already exists
    const existingEdge = graph[from].find(
        edge => edge[0] === to
    );

    if (existingEdge) {

        // Update existing edge
        existingEdge[1] = weight;

    } else {

        graph[from].push([to, weight]);

    }

    // Make graph undirected
    const reverseEdge = graph[to].find(
        edge => edge[0] === from
    );

    if (reverseEdge) {

        reverseEdge[1] = weight;

    } else {

        graph[to].push([from, weight]);

    }

    weightInput.value = "";

    updateEdgeList();
    drawGraph();

    showMessage(
        `Edge ${from} → ${to} with weight ${weight} added.`,
        "success"
    );
}


// ==========================================
// UPDATE DROPDOWNS
// ==========================================

function updateDropdowns() {

    const nodes = Object.keys(graph);

    updateSelect(fromNode, "From", nodes);
    updateSelect(toNode, "To", nodes);
    updateSelect(startNode, "Select start node", nodes);
    updateSelect(endNode, "Select end node", nodes);
}


function updateSelect(select, firstOption, nodes) {

    const oldValue = select.value;

    select.innerHTML = "";

    const first = document.createElement("option");

    first.value = "";
    first.textContent = firstOption;

    select.appendChild(first);

    nodes.forEach(node => {

        const option = document.createElement("option");

        option.value = node;
        option.textContent = node;

        select.appendChild(option);

    });

    // Keep previous selection if possible
    if (nodes.includes(oldValue)) {
        select.value = oldValue;
    }
}


// ==========================================
// DISPLAY EDGE LIST
// ==========================================

function updateEdgeList() {

    const edges = [];
    const added = new Set();

    Object.keys(graph).forEach(from => {

        graph[from].forEach(([to, weight]) => {

            const key = [from, to]
                .sort()
                .join("-");

            if (!added.has(key)) {

                added.add(key);

                edges.push({
                    from: from,
                    to: to,
                    weight: weight
                });

            }

        });

    });


    if (edges.length === 0) {

        edgeList.innerHTML =
            "No edges added yet.";

        return;
    }


    edgeList.innerHTML = "";

    edges.forEach(edge => {

        const div = document.createElement("div");

        div.className = "edge-item";

        div.innerHTML = `
            <span>
                ${edge.from}
                <strong>→</strong>
                ${edge.to}
            </span>

            <span>
                Weight: <strong>${edge.weight}</strong>
            </span>
        `;

        edgeList.appendChild(div);

    });
}


// ==========================================
// DRAW GRAPH
// ==========================================

function drawGraph(step = null) {

    graphSvg.innerHTML = "";

    const nodes = Object.keys(graph);

    if (nodes.length === 0) {

        return;
    }

    const positions = getPositions(nodes);

    const drawnEdges = new Set();

    // ------------------------------
    // DRAW EDGES FIRST
    // ------------------------------

    nodes.forEach(from => {

        graph[from].forEach(([to, weight]) => {

            const key = [from, to]
                .sort()
                .join("-");

            if (drawnEdges.has(key)) {
                return;
            }

            drawnEdges.add(key);

            const p1 = positions[from];
            const p2 = positions[to];

            const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            line.setAttribute("x1", p1.x);
            line.setAttribute("y1", p1.y);

            line.setAttribute("x2", p2.x);
            line.setAttribute("y2", p2.y);

            line.classList.add("edge");

            // Highlight current edge
            if (
                step &&
                step.action === "update" &&
                (
                    (step.from === from && step.to === to) ||
                    (step.from === to && step.to === from)
                )
            ) {

                line.classList.add("active");

            }

            graphSvg.appendChild(line);


            // Weight label

            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            text.setAttribute(
                "x",
                (p1.x + p2.x) / 2
            );

            text.setAttribute(
                "y",
                (p1.y + p2.y) / 2 - 8
            );

            text.classList.add("weight");

            text.textContent = weight;

            graphSvg.appendChild(text);

        });

    });


    // ------------------------------
    // DRAW NODES
    // ------------------------------

    const visited = step
        ? new Set(step.visited || [])
        : new Set();


    nodes.forEach(node => {

        const position = positions[node];

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        group.classList.add("node");


        // Visited node

        if (visited.has(node)) {
            group.classList.add("visited");
        }


        // Current node

        if (step && step.node === node) {
            group.classList.add("current");
        }


        // Start node

        if (node === startNode.value) {
            group.classList.add("start");
        }


        // End node

        if (node === endNode.value) {
            group.classList.add("end");
        }


        // Circle

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx", position.x);
        circle.setAttribute("cy", position.y);
        circle.setAttribute("r", 30);


        // Node name

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.setAttribute("x", position.x);
        text.setAttribute("y", position.y);

        text.textContent = node;


        group.appendChild(circle);
        group.appendChild(text);


        // Distance

        if (
            step &&
            step.distances &&
            step.distances[node] !== undefined
        ) {

            const distance = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            distance.setAttribute(
                "x",
                position.x
            );

            distance.setAttribute(
                "y",
                position.y + 48
            );

            distance.classList.add("distance");

            const value = step.distances[node];

            distance.textContent =
                value === Infinity
                    ? "∞"
                    : value;

            group.appendChild(distance);

        }


        graphSvg.appendChild(group);

    });

}


// ==========================================
// NODE POSITIONS
// ==========================================

function getPositions(nodes) {

    const positions = {};

    const centerX = 400;
    const centerY = 250;

    const radius = Math.min(
        190,
        70 + nodes.length * 18
    );


    nodes.forEach((node, index) => {

        const angle =
            (2 * Math.PI * index / nodes.length)
            - Math.PI / 2;


        positions[node] = {

            x:
                centerX +
                radius * Math.cos(angle),

            y:
                centerY +
                radius * Math.sin(angle)

        };

    });


    return positions;
}


// ==========================================
// RUN DIJKSTRA
// ==========================================

runBtn.addEventListener("click", runDijkstra);

async function runDijkstra() {

    stopPlaying();

    const start = startNode.value;
    const end = endNode.value;


    if (Object.keys(graph).length < 2) {

        showMessage(
            "Please add at least two nodes.",
            "error"
        );

        return;
    }


    if (!start || !end) {

        showMessage(
            "Please select start and end nodes.",
            "error"
        );

        return;
    }


    if (start === end) {

        showMessage(
            "Start and end nodes must be different.",
            "error"
        );

        return;
    }


    try {

        const response = await fetch(
            "/api/dijkstra",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    graph: graph,

                    start: start,

                    end: end

                })

            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Something went wrong."
            );

        }


        result = data;

        currentStep = 0;


        document.getElementById(
            "pathResult"
        ).textContent =
            result.path.length > 0
                ? result.path.join(" → ")
                : "No path found";


        document.getElementById(
            "distanceResult"
        ).textContent =
            result.distance !== null
                ? result.distance
                : "No path";


        document.getElementById(
            "actualSteps"
        ).textContent =
            result.steps.length;


        document.getElementById(
            "stepLabel"
        ).textContent =
            "Algorithm completed. Use Next or Play.";


        document.getElementById(
            "distanceBadge"
        ).textContent =
            "Distance: " +
            (
                result.distance !== null
                    ? result.distance
                    : "∞"
            );


        backBtn.disabled =
            result.steps.length === 0;

        nextBtn.disabled =
            result.steps.length === 0;

        playBtn.disabled =
            result.steps.length === 0;


        updateStepDisplay();

        showMessage(
            "Dijkstra completed successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

    }

}


// ==========================================
// STEP CONTROLS
// ==========================================

nextBtn.addEventListener(
    "click",
    nextStep
);


function nextStep() {

    if (!result) {
        return;
    }


    if (
        currentStep >=
        result.steps.length - 1
    ) {

        return;

    }


    currentStep++;

    updateStepDisplay();

}


backBtn.addEventListener(
    "click",
    previousStep
);


function previousStep() {

    if (!result) {
        return;
    }


    if (currentStep <= 0) {
        return;
    }


    currentStep--;

    updateStepDisplay();

}


// ==========================================
// PLAY / PAUSE
// ==========================================

playBtn.addEventListener(
    "click",
    togglePlay
);


function togglePlay() {

    if (playing) {

        stopPlaying();

        return;

    }


    if (!result) {
        return;
    }


    playing = true;

    playBtn.textContent =
        "❚❚ Pause";


    timer = setInterval(
        function () {

            if (
                currentStep >=
                result.steps.length - 1
            ) {

                stopPlaying();

                return;

            }


            currentStep++;

            updateStepDisplay();

        },
        900
    );

}


function stopPlaying() {

    playing = false;

    clearInterval(timer);

    timer = null;

    playBtn.textContent =
        "▶ Play";

}


// ==========================================
// UPDATE STEP DISPLAY
// ==========================================

function updateStepDisplay() {

    if (!result) {
        return;
    }


    const step =
        result.steps[currentStep];


    drawGraph(step);


    document.getElementById(
        "stepLabel"
    ).textContent =

        `Step ${currentStep + 1}: ` +

        (
            step.action === "visit"

                ? `Visiting ${step.node}`

                : `Updating ${step.to} through ${step.from}`
        );


    document.getElementById(
        "stepCount"
    ).textContent =

        `Step ${
            currentStep + 1
        } / ${
            result.steps.length
        }`;


    backBtn.disabled =
        currentStep === 0;


    nextBtn.disabled =
        currentStep >=
        result.steps.length - 1;

}


// ==========================================
// CLEAR GRAPH
// ==========================================

clearBtn.addEventListener(
    "click",
    clearGraph
);


function clearGraph() {

    stopPlaying();

    graph = {};

    result = null;

    currentStep = 0;


    updateDropdowns();

    updateEdgeList();

    drawGraph();


    document.getElementById(
        "pathResult"
    ).textContent = "—";


    document.getElementById(
        "distanceResult"
    ).textContent = "—";


    document.getElementById(
        "actualSteps"
    ).textContent = "0";


    document.getElementById(
        "stepLabel"
    ).textContent =
        "Add nodes and edges to create your graph.";


    document.getElementById(
        "distanceBadge"
    ).textContent =
        "Distance: —";


    backBtn.disabled = true;

    nextBtn.disabled = true;

    playBtn.disabled = true;


    showMessage(
        "Graph cleared.",
        "success"
    );

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text, type) {

    message.textContent = text;

    message.className =
        "message " + type;

}
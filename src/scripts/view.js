// import { Concept } from './Concept.js'
// import { Tree } from './Tree.js' 

// Putting all classes in 1 file (for now until frontend server is up and running)

// Concept is like a "node" or vertex within a tree
class Concept {

    title;
    description;
    children; // Array of Concepts

    constructor(title, description, children) {
        this.title = title;
        this.description = description;
        this.children = children;
    }

    addChild(child) {
        this.children.append(child)
    }

    toString() {
        return `${this.title}: ${this.description}, children = ${children}`;
    }
    
}

class Tree {
    
    root; // Array of Concepts, representing topmost concepts in tree

    constructor(root) {
        this.root = root;
    }

    toString() {
        return `${this.title}: ${this.description}, children = ${children}`;
    }


}



// Start of actual view.js code


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Infinite canvas logic
let x_offset = 0;
let y_offset = 0;
let prev_x, prev_y;
let is_dragging = false;
let scaleFactor = 1; // Default zoom level

canvas.addEventListener("mousedown", (e) => {
    is_dragging = true;
    prev_x = e.clientX;
    prev_y = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
    if (!is_dragging) 
        return;

    x_offset += (e.clientX - prev_x);
    y_offset += (e.clientY - prev_y);

    prev_x = e.clientX;
    prev_y = e.clientY;

    draw();
});

canvas.addEventListener("mouseup", () => is_dragging = false);
canvas.addEventListener("mouseleave", () => is_dragging = false);

// Mouse Wheel Zoom (scale in/out)
canvas.addEventListener("wheel", (e) => {
    e.preventDefault(); 


    if (e.deltaY < 0) {
        scaleFactor *= 1.05; // Zoom in
    } else {
        scaleFactor *= 0.96; // Zoom out
    }

    draw();
});

function drawWireframe() {
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 0.3;
    const gridSize = 50;

    const adjustedGridSize = gridSize / scaleFactor;

    for (let x = -canvas.width; x < canvas.width * 2; x += adjustedGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -canvas.height);
        ctx.lineTo(x, canvas.height * 2);
        ctx.stroke();
    }

    for (let y = -canvas.height; y < canvas.height * 2; y += adjustedGridSize) {
        ctx.beginPath();
        ctx.moveTo(-canvas.width, y);
        ctx.lineTo(canvas.width * 2, y);
        ctx.stroke();
    }
}

// Create a tree from parsing json file
let concept_hierarchy;

// Fetch test data and initialize visualization
async function initializeVisualization() {
    try {
        const response = await fetch('/test-concepts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const parsed_pdf = await response.json();
        const root = createTree(parsed_pdf);
        concept_hierarchy = new Tree(root);
        console.log('Concept hierarchy loaded:', concept_hierarchy);
        draw(); // Initial draw
    } catch (error) {
        console.error('Error fetching concept data:', error);
    }
}

// Initialize when page loads
window.addEventListener('load', initializeVisualization);

// Get individual concept and information from json file, given the title and json file
function getConcept(title, file) {
    return file[title] || null;
}

// Create node/concept object
function createNode(title, file) {
    const child_info = getConcept(title, file);

    return new Concept(title, child_info.description, []);
}

// Recursive helper function for generating tree
function createTreeHelper(concept, parsed_pdf) {

    const node = createNode(concept, parsed_pdf);


    if (node.children.length === 0)
        return node;

    for (child in node.children) {
        node.children.push( createTreeHelper(child, parsed_pdf) );
    }

    return node;
}

function createTree(parsed_pdf) {
    let root, children;

    // Get first object to be root
    for (var [title, data] of Object.entries(parsed_pdf)) {
        root = new Concept(title, data.description, []);
        children = data.children;
        break;
    }

    // Recursively define children nodes
    if (children.length === 0)
        return root;

    for (let childTitle of children) {
        const childNode = createNode(childTitle, parsed_pdf);
        root.children.push(childNode);
    }

    return root;
}

draw();

function drawNode(x, y, title) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2); // Draw circle
    ctx.fillStyle = "#4A90E2"; 
    ctx.fill();
    ctx.stroke();

    // Set text properties
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";

    // Center the text horizontally
    const textWidth = ctx.measureText(title).width;
    const textX = x - textWidth / 2; // Center horizontally
    const textY = y + 6; // Center vertically

    ctx.fillText(title, textX, textY);
}

function drawConnection(fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function draw() {
    if (!concept_hierarchy || !concept_hierarchy.root) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(x_offset, y_offset);

    drawWireframe();

    // Display nodes for each concept in tree using a level-order traversal
    const nodePositions = new Map(); // Store positions of nodes
    const queue = [{node: concept_hierarchy.root, level: 0, index: 0}];
    const levelCounts = new Map(); // Count nodes at each level
    
    // First pass: count nodes at each level
    const tempQueue = [...queue];
    while (tempQueue.length > 0) {
        const {node, level} = tempQueue.shift();
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
        for (let child of node.children) {
            tempQueue.push({node: child, level: level + 1});
        }
    }

    // Second pass: draw nodes with proper positioning
    while (queue.length > 0) {
        const {node, level, index} = queue.shift();
        
        const levelWidth = levelCounts.get(level);
        const spacing = Math.min(200, canvas.width / (levelWidth + 1));
        const startX = canvas.width/4 - (levelWidth * spacing)/2;
        
        const x = startX + (index + 1) * spacing;
        const y = 100 + level * 150;
        
        nodePositions.set(node, {x, y});
        drawNode(x, y, node.title);

        // Draw connections to children
        let childIndex = 0;
        for (let child of node.children) {
            queue.push({node: child, level: level + 1, index: childIndex++});
        }
    }

    // Draw connections after all nodes are positioned
    for (let [node, pos] of nodePositions) {
        for (let child of node.children) {
            const childPos = nodePositions.get(child);
            if (childPos) {
                drawConnection(pos.x, pos.y, childPos.x, childPos.y);
            }
        }
    }

    ctx.restore();
}

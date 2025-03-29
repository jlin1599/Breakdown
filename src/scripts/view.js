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

// Add these new variables at the top with other global variables
let expandedNodes = new Set(); // Track which nodes are expanded
let activeDescription = null; // Track current description popup

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
parsed_pdf = {
    "Vehicle": {
        description: "Anything that can transport people",
        children: ["Car", "Train", "Plane"]
    },
    "Car": {
        description: "A road vehicle with four wheels, operating by a driver",
        children: []
    },
    "Train": {
        description: "A long distance method for transporting people and cargo",
        children: []
    },
    "Plane": {
        description: "A flying vehicle, for extreme long distance overseas travel",
        children: []
    }
}

// Recursively construct tree from json file

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

    for (child in children) { // Child is not the element in the children array, but the index (because javascript sucks!)
        
        root.children.push( createTreeHelper(children[child], parsed_pdf) );
    }

    return root;

}

// createNode("Vehicle", parsed_pdf);
root = createTree(parsed_pdf);
const concept_hierarchy = new Tree(root);
console.log(concept_hierarchy);





draw();

function drawConnection(fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.stroke();
}

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

// Add double-click handler for node expansion
canvas.addEventListener("dblclick", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedNode = getNodeByPosition(mouseX, mouseY);
    
    if (clickedNode) {
        if (expandedNodes.has(clickedNode.title)) {
            // Collapse this node
            expandedNodes.delete(clickedNode.title);
            // Also collapse all descendant nodes
            const stack = [...clickedNode.children];
            while (stack.length > 0) {
                const node = stack.pop();
                expandedNodes.delete(node.title);
                stack.push(...node.children);
            }
            activeDescription = null;
        } else {
            // Expand this node
            expandedNodes.add(clickedNode.title);
            // Show description
            activeDescription = {
                x: mouseX,
                y: mouseY,
                text: clickedNode.description
            };
        }
        draw();
    } else {
        // Click was not on a node, clear description
        activeDescription = null;
        draw();
    }
});

// Add this function to get node under mouse position
function getNodeByPosition(mouseX, mouseY) {
    if (!concept_hierarchy || !nodePositions) return null;
    
    const x = (mouseX - x_offset) / scaleFactor;
    const y = (mouseY - y_offset) / scaleFactor;
    
    for (let [node, pos] of nodePositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (dx * dx + dy * dy < 400) { // 20px radius
            return node;
        }
    }
    return null;
}

// Add this function to draw description popup
function drawDescription(x, y, text) {
    const padding = 10;
    const maxWidth = 300;
    
    ctx.font = "14px Arial";
    
    // Wrap text
    const words = text.split(' ');
    let line = '';
    let lines = [];
    
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    const lineHeight = 20;
    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;
    
    // Draw popup background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - boxWidth/2, y - boxHeight - 30, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#333';
    lines.forEach((line, i) => {
        ctx.fillText(
            line, 
            x - maxWidth/2, 
            y - boxHeight - 15 + (i + 1) * lineHeight
        );
    });
}

// Modify the draw function to only show expanded nodes
function draw() {
    if (!concept_hierarchy || !concept_hierarchy.root) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(x_offset, y_offset);

    drawWireframe();

    // Store positions for visible nodes
    nodePositions = new Map();
    const visibleNodes = new Map(); // Track which nodes should be visible
    
    // Start with root node
    const root = concept_hierarchy.root;
    visibleNodes.set(root, { level: 0, index: 0 });

    // Add children of expanded nodes
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        const nodeInfo = visibleNodes.get(node);
        
        if (expandedNodes.has(node.title)) {
            node.children.forEach((child, childIndex) => {
                visibleNodes.set(child, {
                    level: nodeInfo.level + 1,
                    index: childIndex
                });
                queue.push(child);
            });
        }
    }

    // Count nodes at each level
    const levelCounts = new Map();
    for (let [node, info] of visibleNodes) {
        const level = info.level;
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    }

    // Calculate and store positions for visible nodes
    for (let [node, info] of visibleNodes) {
        const level = info.level;
        const levelWidth = levelCounts.get(level);
        const spacing = Math.min(200, canvas.width / (levelWidth + 1));
        const startX = canvas.width/4 - (levelWidth * spacing)/2;
        
        const x = startX + (info.index + 1) * spacing;
        const y = 100 + level * 150;
        
        nodePositions.set(node, {x, y});
        drawNode(x, y, node.title);
    }

    // Draw connections for visible nodes
    for (let [node, pos] of nodePositions) {
        if (expandedNodes.has(node.title)) {
            for (let child of node.children) {
                const childPos = nodePositions.get(child);
                if (childPos) {
                    drawConnection(pos.x, pos.y, childPos.x, childPos.y);
                }
            }
        }
    }

    // Draw active description if any
    if (activeDescription) {
        drawDescription(
            activeDescription.x,
            activeDescription.y,
            activeDescription.text
        );
    }

    ctx.restore();
}

// Initialize with only root node visible
window.addEventListener('load', () => {
    if (concept_hierarchy && concept_hierarchy.root) {
        expandedNodes = new Set(); // Start with no nodes expanded
        draw();
    }
});

// import { Concept } from './Concept.js'
// import { Tree } from './Tree.js' 

// Putting all classes in 1 file (for now until frontend server is up and running)

// Concept is like a "node" or vertex within a tree
class Concept {
    constructor(title, description, children) {
        this.title = title;
        this.description = description;
        this.children = children;
    }
}

class Tree {
    constructor(root) {
        this.root = root;
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Global variables
let x_offset = 0;
let y_offset = 0;
let prev_x, prev_y;
let is_dragging = false;
let scaleFactor = 1;
let expandedNodes = new Set();
let activeDescription = null;
let nodePositions = new Map();

// Canvas setup
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
    canvas.style.marginTop = '60px';
    draw();
}

// Event listeners
canvas.addEventListener("mousedown", (e) => {
    is_dragging = true;
    prev_x = e.clientX;
    prev_y = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
    if (!is_dragging) return;
    x_offset += (e.clientX - prev_x);
    y_offset += (e.clientY - prev_y);
    prev_x = e.clientX;
    prev_y = e.clientY;
    draw();
});

canvas.addEventListener("mouseup", () => is_dragging = false);
canvas.addEventListener("mouseleave", () => is_dragging = false);

canvas.addEventListener("wheel", (e) => {
    e.preventDefault(); 
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldCenterX = (centerX - x_offset) / scaleFactor;
    const worldCenterY = (centerY - y_offset) / scaleFactor;
    
    scaleFactor *= zoomFactor;
    scaleFactor = Math.min(Math.max(scaleFactor, 0.1), 5);
    
    const newScreenX = worldCenterX * scaleFactor + x_offset;
    const newScreenY = worldCenterY * scaleFactor + y_offset;
    
    x_offset += centerX - newScreenX;
    y_offset += centerY - newScreenY;
    draw();
});

canvas.addEventListener("dblclick", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickedNode = getNodeByPosition(mouseX, mouseY);
    
    if (clickedNode) {
        if (expandedNodes.has(clickedNode.title)) {
            expandedNodes.delete(clickedNode.title);
            const stack = [...clickedNode.children];
            while (stack.length > 0) {
                const node = stack.pop();
                expandedNodes.delete(node.title);
                stack.push(...node.children);
            }
            activeDescription = null;
        } else {
            expandedNodes.add(clickedNode.title);
            const nodePos = nodePositions.get(clickedNode);
            if (nodePos) {
                activeDescription = {
                    x: nodePos.x,
                    y: nodePos.y,
                    text: clickedNode.description
                };
            }
        }
        draw();
    } else {
        activeDescription = null;
        draw();
    }
});

// Drawing functions
function drawWireframe() {
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 0.3;
    const gridSize = 50 / scaleFactor;

    for (let x = -canvas.width; x < canvas.width * 2; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -canvas.height);
        ctx.lineTo(x, canvas.height * 2);
        ctx.stroke();
    }

    for (let y = -canvas.height; y < canvas.height * 2; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-canvas.width, y);
        ctx.lineTo(canvas.width * 2, y);
        ctx.stroke();
    }
}

function drawConnection(fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    const midY = (fromY + toY) / 2;
    ctx.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
    
    const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#357ABD');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawNode(x, y, title) {
    ctx.save();
    
    // Draw shadow and circle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#4A90E2";
    ctx.fill();
    
    // Draw border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = "#357ABD";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "black";
    ctx.font = "bold 14px Arial";
    const textWidth = ctx.measureText(title).width;
    ctx.fillText(title, x - textWidth / 2, y + 5);

    // Draw expand/collapse indicator
    if (concept_hierarchy && getNodeByTitle(title)?.children.length > 0) {
        const isExpanded = expandedNodes.has(title);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        const angle = Math.PI / 6;
        const distance = 35;
        ctx.fillText(isExpanded ? "-" : "+", 
            x + distance * Math.cos(angle), 
            y - distance * Math.sin(angle));
    }
    
    ctx.restore();
}

function drawDescription(x, y, text) {
    const padding = 15;
    const maxWidth = 300;
    ctx.font = "14px Arial";
    
    const words = text.split(' ');
    let lines = [];
    let line = '';
    
    for (let word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
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
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.beginPath();
    ctx.roundRect(x - boxWidth/2, y - boxHeight - 40, boxWidth, boxHeight, 12);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#333';
    lines.forEach((line, i) => {
        ctx.fillText(line, x - maxWidth/2, y - boxHeight - 25 + (i + 1) * lineHeight);
    });
    
    ctx.restore();
}

function draw() {
    if (!concept_hierarchy || !concept_hierarchy.root) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2 + x_offset, canvas.height/2 + y_offset);
    ctx.scale(scaleFactor, scaleFactor);

    drawWireframe();

    nodePositions = new Map();
    const visibleNodes = new Map();
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

    // Calculate positions and draw nodes
    const levelCounts = new Map();
    for (let [node, info] of visibleNodes) {
        levelCounts.set(info.level, (levelCounts.get(info.level) || 0) + 1);
    }

    for (let [node, info] of visibleNodes) {
        const levelWidth = levelCounts.get(info.level);
        const spacing = Math.min(300, 800 / (levelWidth + 1));
        const x = -(levelWidth - 1) * spacing/2 + info.index * spacing;
        const y = -200 + info.level * 150;
        
        nodePositions.set(node, {x, y});
        drawNode(x, y, node.title);
    }

    // Draw connections
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

    // Draw description box if active
    if (activeDescription) {
        drawDescription(activeDescription.x, activeDescription.y, activeDescription.text);
    }

    ctx.restore();
}

// Helper functions
function getNodeByPosition(mouseX, mouseY) {
    if (!concept_hierarchy || !nodePositions) return null;
    const x = (mouseX - canvas.width/2 - x_offset) / scaleFactor;
    const y = (mouseY - canvas.height/2 - y_offset) / scaleFactor;
    
    for (let [node, pos] of nodePositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (dx * dx + dy * dy < 400) return node;
    }
    return null;
}

function getNodeByTitle(title) {
    if (!concept_hierarchy) return null;
    const queue = [concept_hierarchy.root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node.title === title) return node;
        queue.push(...node.children);
    }
    return null;
}

// Navigation setup
const style = document.createElement('style');
style.textContent = `
    .nav-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        padding: 0 20px;
        z-index: 1000;
    }
    .nav-button {
        padding: 8px 16px;
        margin-right: 15px;
        border: none;
        border-radius: 6px;
        background: #4A90E2;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    .nav-button:hover {
        background: #357ABD;
        transform: translateY(-1px);
    }
    .title {
        font-size: 18px;
        color: #333;
        margin-left: auto;
        font-weight: 500;
    }
    .controls-hint {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 10px 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        color: #666;
        z-index: 1000;
    }
`;
document.head.appendChild(style);

const navBar = document.createElement('div');
navBar.className = 'nav-bar';

const backButton = document.createElement('button');
backButton.className = 'nav-button';
backButton.textContent = '← Back to Upload';
backButton.onclick = () => window.location.href = '/pdf-viewer';

const homeButton = document.createElement('button');
homeButton.className = 'nav-button';
homeButton.textContent = 'Home';
homeButton.onclick = () => window.location.href = '/';

const title = document.createElement('div');
title.className = 'title';
title.textContent = 'Concept Map Visualization';

navBar.appendChild(backButton);
navBar.appendChild(homeButton);
navBar.appendChild(title);
document.body.appendChild(navBar);

const controlsHint = document.createElement('div');
controlsHint.className = 'controls-hint';
controlsHint.textContent = '🖱️ Double-click: Expand/Collapse | Scroll: Zoom | Drag: Pan';
document.body.appendChild(controlsHint);

// Initialize
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    if (concept_hierarchy && concept_hierarchy.root) {
        expandedNodes = new Set();
        draw();
    }
});

// Test data
const parsed_pdf = {
    "Quantum Mechanics": {
        description: "Study of physical phenomena at nanoscopic scales",
        children: ["Quantum State", "Electric Field", "Hydrogen Atom"]
    },
    "Quantum State": {
        description: "A mathematical description of a quantum system",
        children: ["Orthogonality", "Different Quantum States", "Wave Function"]
    },
    "Electric Field": {
        description: "A field surrounding charged particles, influencing force",
        children: ["Dipole", "Laser Interactions"]
    },
    "Hydrogen Atom": {
        description: "The simplest atom with one proton and one electron",
        children: ["Different Quantum States", "Laser Interactions"]
    },
    "Orthogonality": {
        description: "Property where two functions are orthogonal in inner product space",
        children: []
    },
    "Different Quantum States": {
        description: "Various possible energy levels of an electron in an atom",
        children: []
    },
    "Wave Function": {
        description: "Mathematical function describing quantum states",
        children: []
    },
    "Dipole": {
        description: "A system of two equal and oppositely charged or magnetized poles",
        children: []
    },
    "Laser Interactions": {
        description: "Interaction of laser fields with atomic or molecular systems",
        children: []
    }
};


function getConcept(title, file) {
    return file[title] || null;
}

function createNode(title, file) {
    const child_info = getConcept(title, file);
    return new Concept(title, child_info.description, []);
}

function buildNodeChildren(node, file) {
    const nodeInfo = getConcept(node.title, file);
    if (!nodeInfo) return;
    
    for (let childTitle of nodeInfo.children) {
        const childNode = createNode(childTitle, file);
        node.children.push(childNode);
        buildNodeChildren(childNode, file);
    }
}

function createTree(parsed_pdf) {
    let root;
    for (var [title, data] of Object.entries(parsed_pdf)) {
        root = new Concept(title, data.description, []);
        break;
    }

    if (!root) return null;
    buildNodeChildren(root, parsed_pdf);
    return root;
}

const root = createTree(parsed_pdf);
const concept_hierarchy = new Tree(root);
resizeCanvas();

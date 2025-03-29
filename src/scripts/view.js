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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.scale(scaleFactor, scaleFactor);

    ctx.translate(x_offset, y_offset);

    drawWireframe();

    // Example text
    ctx.fillStyle = "red";
    ctx.font = "24px Arial";
    ctx.fillText("Zoom and Pan the canvas!", 150, 150); // This text will also zoom and pan

    ctx.restore();
}

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

function createNode(title, file) {
    const child_info = getConcept(title, file);

    return new Concept(title, child_info.description, []);
}

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
;
console.log(concept_hierarchy)


draw();

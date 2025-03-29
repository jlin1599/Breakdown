const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Infinite canvas logic
let x_offset = 0;
let y_offset = 0;
let prev_x, prev_y;
let is_dragging = false;

canvas.addEventListener("mousedown", (e) => {
    
    is_dragging = true;
    prev_x = e.clientX;
    prev_y = e.clientY;

});

canvas.addEventListener("mousemove", (e) => {
    
    if (!is_dragging) 
        return;

    x_offset += e.clientX - prev_x;
    y_offset += e.clientY - prev_y;

    prev_x = e.clientX;
    prev_y = e.clientY;

    draw();

});

canvas.addEventListener("mouseup", () => is_dragging = false);
canvas.addEventListener("mouseleave", () => is_dragging = false);

// Main canvas
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(x_offset, y_offset);

    drawWireframe();

    ctx.restore();
}

function drawWireframe() {

    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 0.1;
    const gridSize = 50;

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

draw();
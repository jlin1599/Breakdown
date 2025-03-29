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

draw();

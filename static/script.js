// Function to render a pie chart with hover interactivity and expense names
function renderExpensesChart() {
    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById("expenses-chart").getBoundingClientRect().width;
    canvas.height = document.getElementById("expenses-chart").getBoundingClientRect().height;
    const ctx = canvas.getContext('2d');

    // Sample data for the pie chart
    const data = [
        { name: 'Rent', value: 25 },
        { name: 'Groceries', value: 20 },
        { name: 'Transport', value: 30 },
        { name: 'Entertainment', value: 15 },
        { name: 'Misc', value: 10 },
    ];
    const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = { x: canvas.width/2, y: canvas.height/2, radius: canvas.width/4 };

    // Store slice information
    const slices = [];
    let startAngle = 0;

    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        slices.push({
            startAngle,
            endAngle: startAngle + sliceAngle,
            color: colors[index],
            value: item.value,
            name: item.name,
        });
        startAngle += sliceAngle;
    });

    function drawChart(hoveredIndex = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        slices.forEach((slice, index) => {
            const isHovered = index === hoveredIndex;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.arc(
                center.x,
                center.y,
                isHovered ? center.radius + 10 : center.radius, // Enlarge hovered slice
                slice.startAngle,
                slice.endAngle
            );
            ctx.closePath();
            ctx.fillStyle = slice.color;
            ctx.fill();

            // Calculate label position
            const angle = (slice.startAngle + slice.endAngle) / 2; // Midpoint angle of the slice
            const labelX = center.x + Math.cos(angle) * (center.radius + 15); // Position slightly outside the pie
            const labelY = center.y + Math.sin(angle) * (center.radius + 15);

            // Draw label for the name
            ctx.font = '12px Arial';
            ctx.fillStyle = '#344955';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slice.name, labelX, labelY);

            // Show percentage value on hover
            if (isHovered) {
                ctx.font = '14px Arial bold';
                ctx.fillStyle = '#000000';
                const hoverValueX = center.x + Math.cos(angle) * (center.radius -5); // Further outside for hover values
                const hoverValueY = center.y + Math.sin(angle) * (center.radius -5);
                ctx.fillText(`${slice.value}%`, hoverValueX, hoverValueY);
            }
        });
    }



    // Add hover interactivity
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate angle and distance from the center
        const dx = mouseX - center.x;
        const dy = mouseY - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const adjustedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

        // Detect if the mouse is over a slice
        let hoveredIndex = null;
        if (distance <= center.radius + 10) {
            slices.forEach((slice, index) => {
                if (
                    adjustedAngle >= slice.startAngle &&
                    adjustedAngle <= slice.endAngle
                ) {
                    hoveredIndex = index;
                }
            });
        }

        drawChart(hoveredIndex);
    });

    drawChart(); // Initial draw
    document.getElementById('expenses-chart').appendChild(canvas);
}

// Function to render a line chart with hover interactivity
function renderInvestmentsChart() {
    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById("expenses-chart").getBoundingClientRect().width;
    canvas.height = document.getElementById("expenses-chart").getBoundingClientRect().height;
    const ctx = canvas.getContext('2d');

    // Sample data for the line chart
    const data = [10, 20, 15, 30, 40];
    const points = [];
    const offset = 20
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(offset, canvas.height-offset);
    ctx.lineTo(290, canvas.height-offset); // X-axis
    ctx.moveTo(offset, canvas.height-offset);
    ctx.lineTo(offset, 10); // Y-axis
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the data as a line and store points for interactivity
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = offset + index * 50;
        const y = canvas.height-offset - value * 2;
        points.push({ x, y, value });

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Plot data points
    points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
    });

    ctx.arc(points[points.length-1].x, points[points.length-1].y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#344955';
    ctx.fillText(points[points.length-1].value, points[points.length-1].x - 10, points[points.length-1].y - 10);
    // Add hover interactivity
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Clear canvas and redraw everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw axes
        ctx.beginPath();
        ctx.moveTo(offset, canvas.height-offset);
        ctx.lineTo(290, canvas.height-offset); // X-axis
        ctx.moveTo(offset, canvas.height-offset);
        ctx.lineTo(offset, 10); // Y-axis
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Redraw the line
        ctx.beginPath();
        data.forEach((value, index) => {
            const x = offset + index * 50;
            const y = canvas.height-offset - value * 2;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Redraw points and handle hover effects
        points.forEach((point) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
            );

            if (distance < 8) {
                // Highlight point and show value
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = '#3498db';
                ctx.fill();

                // Display value above the point
                ctx.font = '12px Arial';
                ctx.fillStyle = '#344955';
                ctx.fillText(point.value, point.x - 10, point.y - 10);
            } else {
                // Normal point
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#e74c3c';
                ctx.fill();
            }
        });
        ctx.beginPath();
        ctx.arc(points[points.length-1].x, points[points.length-1].y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#344955';
        ctx.fillText(points[points.length-1].value, points[points.length-1].x - 10, points[points.length-1].y - 10);
    });

    document.getElementById('investments-chart').appendChild(canvas);
}

// Call the rendering functions

renderExpensesChart();
renderInvestmentsChart();

function telemetry(){
    alert("height"+document.getElementById('sidebar').height);
    alert("width"+document.getElementById('sidebar').size);
    alert("height"+document.getElementById('expenses-chart').children[0].height);
    alert("width"+document.getElementById('expenses-chart').children[0].width);
}
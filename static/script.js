// Function to render a pie chart with smooth transitions and animated labels
function renderExpensesChart() {
    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById("expenses-chart").getBoundingClientRect().width;
    canvas.height = document.getElementById("expenses-chart").getBoundingClientRect().height;
    const ctx = canvas.getContext('2d');

    const data = [
        { name: 'Rent', value: 25 },
        { name: 'Health', value: 25 },
        { name: 'Groceries', value: 20 },
        { name: 'Transport', value: 30 },
        { name: 'Entertainment', value: 15 },
        { name: 'Misc', value: 10 },
    ];

    const colors = ['#1C7293', '#065A82', '#21295C', '#1B3B6F', '#117A65', '#4CAF50'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = { x: canvas.width / 2, y: canvas.height / 2, radius: canvas.width / 4 };
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
            growth: 0,
            textScale: 0 // Initial text scale for animation
        });
        startAngle += sliceAngle;
    });

    let hoveredIndex = null;

    function animateChart() {
        slices.forEach((slice, index) => {
            // Animate only the hovered slice
            if (index === hoveredIndex) {
                slice.growth += (10 - slice.growth) * 0.1;
                slice.textScale += (1 - slice.textScale) * 0.1; // Animate text scale
            } else {
                slice.growth += (0 - slice.growth) * 0.1;
                slice.textScale += (0 - slice.textScale) * 0.1; // Animate text scale back
            }
        });

        drawChart();
        requestAnimationFrame(animateChart); // Keep animating continuously
    }

    function drawChart() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        slices.forEach((slice) => {
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.arc(center.x, center.y, center.radius + slice.growth, slice.startAngle, slice.endAngle);
            ctx.closePath();
            ctx.fillStyle = slice.color;
            ctx.fill();

            // Add labels and percentage with animation
            const midAngle = (slice.startAngle + slice.endAngle) / 2;
            const labelX = center.x + Math.cos(midAngle) * (center.radius + 20);
            const labelY = center.y + Math.sin(midAngle) * (center.radius + 20);

            const percentage = ((slice.value / total) * 100).toFixed(1); // Calculate percentage

            ctx.font = `${12 * slice.textScale}px Arial`; // Scale font size with textScale
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(`${slice.name} (${percentage}%)`, labelX, labelY); // Show name and percentage
        });
    }

    // Add hover event listener to interact with slices
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dx = mouseX - center.x;
        const dy = mouseY - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const adjustedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
        let newHoveredIndex = null;

        if (distance <= center.radius + 10) {
            slices.forEach((slice, index) => {
                if (adjustedAngle >= slice.startAngle && adjustedAngle <= slice.endAngle) {
                    newHoveredIndex = index;
                }
            });
        }

        if (newHoveredIndex !== hoveredIndex) {
            hoveredIndex = newHoveredIndex;
        }
    });

    drawChart();
    animateChart(); // Start the animation
    document.getElementById('expenses-chart').appendChild(canvas);
}
function renderInvestmentsChart() {
    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById("investments-chart").getBoundingClientRect().width;
    canvas.height = document.getElementById("investments-chart").getBoundingClientRect().height;
    const ctx = canvas.getContext('2d');

    const data = [1000, 20, 0, 30, 4800, 40, 20, 60, 200, 1000, 5000];
    const offset = 20;
    let animationProgress = 0;
    let hoveredPoint = null;
    let labelScale = 0; // For animating label size
    let hoverRadius = 0; // To animate the hover point circle

    function render() {
        // Continue animating by incrementing animationProgress
        animationProgress += 0.05;
        if (animationProgress > 1) {
            animationProgress = 1; // Limit progress to 1
        }

        drawChart(animationProgress);
        requestAnimationFrame(render); // Continue rendering every frame
    }

    function drawChart(progress) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(offset, canvas.height - offset);
        ctx.lineTo(canvas.width - offset, canvas.height - offset);
        ctx.moveTo(offset, canvas.height - offset);
        ctx.lineTo(offset, 10);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        const points = [];  // Reinitialize points for each frame

        ctx.beginPath();
        data.forEach((value, index) => {
            const x = offset + index * ((canvas.width - 30) / data.length);
            const y = canvas.height - offset - value * ((canvas.height - offset * 3) / Math.max(...data)) * progress;
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

        // Draw the hovered point's value with animation
        if (hoveredPoint) {
            labelScale += (1 - labelScale) * 0.1; // Smoothly animate the label size
            hoverRadius += (8 - hoverRadius) * 0.1; // Animate hover circle radius

            ctx.fillStyle = '#000';
            ctx.font = `${14 * labelScale}px Arial`; // Scale the text size
            ctx.textAlign = 'center'; // Ensure the text is centered
            ctx.fillText(`${hoveredPoint.value}`, hoveredPoint.x, hoveredPoint.y - 20); // Place text just above the point

            // Draw the hover point circle (indicator)
            ctx.beginPath();
            ctx.arc(hoveredPoint.x, hoveredPoint.y, hoverRadius, 0, Math.PI * 2); // Circle size animates
            ctx.fillStyle = '#e74c3c';
            ctx.fill();
        }

        // Draw the latest data point (without animation)
        const lastPoint = points[points.length - 1];
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${lastPoint.value}`, lastPoint.x, lastPoint.y - 20);

        // Draw the latest data point indicator (static, no animation)
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2); // Static circle for latest data point
        ctx.fillStyle = '#2ecc71'; // Green for latest point
        ctx.fill();
    }

    // Mousemove event listener to track hover over points
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Reinitialize points and find the closest one
        hoveredPoint = null;
        data.forEach((value, index) => {
            const x = offset + index * ((canvas.width - 30) / data.length);
            const y = canvas.height - offset - value * ((canvas.height - offset * 3) / Math.max(...data)) * animationProgress;

            const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
            if (distance < 10) {
                hoveredPoint = { x, y, value }; // Set the hovered point
            }
        });

        // If the mouse is no longer hovering over a point, reset label animation
        if (!hoveredPoint) {
            labelScale = 0;
            hoverRadius = 0; // Reset hover radius animation
        }

        drawChart(animationProgress); // Redraw the chart with hovered point value
    });

    render(); // Start the rendering loop
    document.getElementById('investments-chart').appendChild(canvas);
}


renderExpensesChart();
renderInvestmentsChart();

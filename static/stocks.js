function updateTimePeriod() {
    const timePeriod = document.getElementById("time-period").value;
    window.location.href = `/stocks?time_period=${timePeriod}`;
}



document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const response = await fetch('/stocks', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            // Update the chart with new data
            const weeklyData = result.weekly_data;
            const labels = weeklyData.map(data => data.date);
            const prices = weeklyData.map(data => data.price);

            stockChart.data.labels = labels;
            stockChart.data.datasets[0].data = prices;
            stockChart.update();
        } else {
            alert("An error occurred. Please try again.");
        }
    });
});

function createChart(weekly_data ){



    const ctx = document.getElementById('stockChart').getContext('2d');
    const stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekly_data.map(data => data.date),
            datasets: [{
                label: 'Total Money (USD)',
                data: weekly_data.map(data => data.price),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Total Money (USD)'
                    }
                }
            }
        }
    });

}
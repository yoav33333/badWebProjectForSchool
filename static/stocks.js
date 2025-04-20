function updateTimePeriod() {
    const timePeriod = document.getElementById("time-period").value;
    window.location.href = `/stocks?time_period=${timePeriod}`;
}


/**
 * Updates the chart with new weekly data from the server response.
 *
 * @param {Array} weeklyData - Array of objects containing `date` and `price` properties.
 */
function updateChartWithNewData(weeklyData) {
    const labels = weeklyData.map(data => data.date);
    const prices = weeklyData.map(data => data.price);

    stockChart.data.labels = labels; // Update the X-axis labels
    stockChart.data.datasets[0].data = prices; // Update the dataset values
    stockChart.update(); // Refresh the chart to reflect the changes
}

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





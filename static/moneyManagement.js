function createExpensesChart(expenses_dataL, expenses_dataD){
    const expensesBudgetCtx = document.getElementById('expensesBudgetChart').getContext('2d');
    alert("Creating Expenses Chart");
    // Budget vs Expenses Chart
    new Chart(expensesBudgetCtx, {
        type: 'pie',
        data: {
            labels: expenses_dataL,
            datasets: [{
                data: expenses_dataD,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        }
    });
}

function createNetWorthGraph(net_worth_data) {
    const netWorthCtx = document.getElementById('netWorthChart').getContext('2d');

    const netWorthData = net_worth_data;
    const labels = netWorthData.map(item => item.month);
    const data = netWorthData.map(item => item.net_worth);

    // Net Worth Over Time Chart
    new Chart(netWorthCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Worth',
                data: data,
                borderColor: '#36A2EB',
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Worth ($)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}
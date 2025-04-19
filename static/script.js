function createInvestmentGraph(weekly_data) {

    const weeklyData = weekly_data;
    const labels = weeklyData.map(data => data.date);
    const prices = weeklyData.map(data => data.price);

    const ctx = document.getElementById('stockChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Money (USD)',
                data: prices,
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

function createExpensesGraph(monthly_budget, expenses_data){
    const homeBudgetCtx = document.getElementById('homeBudgetChart').getContext('2d');
    const homeBudget = monthly_budget;
    const homeExpenses = expenses_data;
    const homeOverflow = Math.max(homeExpenses - homeBudget, 0);
    const homeRemaining = Math.max(homeBudget - homeExpenses, 0);

    new Chart(homeBudgetCtx, {
        type: 'doughnut',
        data: {
            labels: ['Expenses', 'Remaining Budget', 'Overflow'],
            datasets: [{
                data: [Math.min(homeBudget,homeExpenses), homeRemaining, homeOverflow],
                backgroundColor: ['#FF6384', '#36A2EB', '#FF0000'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });

}
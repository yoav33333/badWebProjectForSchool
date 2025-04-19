function createDoughnutChart(expenses_dataL, expenses_dataD, monthly_budget){
    const expensesBudgetCtx = document.getElementById('expensesBudgetChart').getContext('2d');
    const expensesLabels = expenses_dataL;
    const expensesData = expenses_dataD;
    const expensesBudget = monthly_budget;
    let cumulativeTotal = 0;

    const adjustedData = [];
    const adjustedColors = [];
    const borderColors = [];
    const baseColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']; // Base colors

    expensesData.forEach((amount, index) => {
        const baseColor = baseColors[index % baseColors.length];
        if (cumulativeTotal + amount <= expensesBudget) {
            // Entire expense is within the budget
            adjustedData.push(amount);
            adjustedColors.push(baseColor);
            borderColors.push(baseColor); // No red border
        } else {
            // Split the expense into within-budget and overflow parts
            const withinBudget = Math.max(0, expensesBudget - cumulativeTotal);
            const overflow = amount - withinBudget;

            if (withinBudget > 0) {
                adjustedData.push(withinBudget);
                adjustedColors.push(baseColor);
                borderColors.push(baseColor); // No red border
            }
            if (overflow > 0) {
                adjustedData.push(overflow);
                adjustedColors.push(baseColor); // Keep the same color
                borderColors.push('#FF0000'); // Red border for overflow
            }
        }
        cumulativeTotal += amount;
    });

    new Chart(expensesBudgetCtx, {
        type: 'doughnut',
        data: {
            labels: expensesLabels,
            datasets: [{
                data: adjustedData,
                backgroundColor: adjustedColors,
                borderColor: borderColors,
                borderWidth: 2, // Add border width for better visibility
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
function createBarChart(bar_chart_data){

    const barChartCtx = document.getElementById('monthlyExpensesChart').getContext('2d');
    const barChartData = bar_chart_data;
    const months = barChartData.months;
    const categories = barChartData.categories;
    const data = barChartData.data;

    new Chart(barChartCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: categories.map((category, index) => ({
                label: category,
                data: data.map(monthData => monthData[index]),
                backgroundColor: `hsl(${index * 50}, 70%, 50%)`
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });

}
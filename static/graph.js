function initializeCharts() {
    const lineCtx = document.getElementById('dataLineChart').getContext('2d');
    const barCtx = document.getElementById('dataBarChart').getContext('2d');

    new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: sampleData.slice(0, 10).map(item => item.name),
            datasets: [{
                label: 'Values Over Time',
                data: sampleData.slice(0, 10).map(item => item.value),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        }
    });

    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Electronics', 'Clothing', 'Food', 'Home', 'Office'],
            datasets: [{
                label: 'Category Distribution',
                data: [23, 18, 15, 12, 9],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ]
            }]
        }
    });
}
//initializeCharts();
fetch('/weekly-chart-data')
.then(response => response.json())
.then(data => {
  const chartConfig = {
    type: 'bar',
    data: data,
    options: {
      // Chart options go here
    }
  };
  const chart = new Chart(document.getElementById('weekly_chart'), chartConfig);
})
.catch(error => console.error(error));


fetch('/monthly-chart-data')
.then(response => response.json())
.then(data => {
  const chartConfig = {
    type: 'line',
    data: data,
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
      // Chart options go here
    }
  };
  const chart = new Chart(document.getElementById('monthly_chart'), chartConfig);
})
.catch(error => console.error(error));
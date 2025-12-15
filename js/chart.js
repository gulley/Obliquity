/**
 * Chart.js Discrepancy Plot
 */

class DiscrepancyChart {
    constructor(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        this.currentDay = 0;
        this.numDays = 0;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Time Discrepancy',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,  // No points for smooth line
                    tension: 0.4  // Slight curve
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Day of Year'
                        },
                        ticks: {
                            callback: (value, index, values) => {
                                // Custom labels for key points
                                const totalDays = this.numDays || 365;
                                if (index === 0) return 'Start';
                                if (index === Math.floor(totalDays * 0.25)) return 'Quarter';
                                if (index === Math.floor(totalDays * 0.5)) return 'Half';
                                if (index === Math.floor(totalDays * 0.75)) return '3/4';
                                if (index === totalDays - 1) return 'End';
                                // Show every 30th day number
                                if (index % 30 === 0) return index;
                                return '';
                            },
                            maxRotation: 0,
                            autoSkip: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Discrepancy (minutes)'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Day ${context.label}: ${context.parsed.y.toFixed(2)} minutes`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 0  // Disable animation for real-time feel
                }
            }
        });
    }

    updateData(discrepancies) {
        const labels = discrepancies.map(d => d.day);
        const data = discrepancies.map(d => d.minutes);

        this.numDays = discrepancies.length;

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update('none');  // No animation for real-time feel
    }

    highlightDay(dayOfYear) {
        this.currentDay = dayOfYear;
        // Note: Chart.js annotation plugin would be needed for vertical line
        // For now, we'll just update the tooltip to show the current day
        // This could be enhanced with the annotation plugin
    }
}

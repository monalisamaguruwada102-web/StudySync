import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const FocusRadar = () => {
    const { isDarkMode } = useTheme();

    // Mock data based on "psychological profile" of study habits
    // In a real implementation, calculating these from logs would be complex logic
    const data = useMemo(() => {
        return {
            labels: ['Memory', 'Logic', 'Focus', 'Speed', 'Visual', 'Creativity'],
            datasets: [
                {
                    label: 'Current Stats',
                    data: [85, 70, 90, 65, 80, 55], // Example values
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    borderColor: isDarkMode ? '#818cf8' : '#6366f1',
                    borderWidth: 2,
                    pointBackgroundColor: isDarkMode ? '#818cf8' : '#6366f1',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: isDarkMode ? '#818cf8' : '#6366f1',
                },
                {
                    label: 'Goal',
                    data: [90, 90, 90, 90, 90, 90], // Target
                    backgroundColor: 'transparent',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                },
            ],
        };
    }, [isDarkMode]);

    const options = useMemo(() => {
        const textColor = isDarkMode ? '#94a3b8' : '#64748b';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

        return {
            scales: {
                r: {
                    angleLines: {
                        color: gridColor,
                    },
                    grid: {
                        color: gridColor,
                    },
                    pointLabels: {
                        color: textColor,
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif",
                            weight: '600',
                        },
                        backdropColor: 'transparent', // Remove background behind labels
                    },
                    ticks: {
                        display: false, // Hide numeric ticks
                        backdropColor: 'transparent',
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
                    bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 12,
                }
            },
            maintainAspectRatio: false,
        };
    }, [isDarkMode]);

    return (
        <div className="w-full h-64 relative">
            <Radar data={data} options={options} />

            {/* Decorative glow behind chart */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full opacity-50" />
        </div>
    );
};

export default FocusRadar;

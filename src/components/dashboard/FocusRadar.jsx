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

const FocusRadar = ({ stats }) => {
    const { isDarkMode } = useTheme();

    // Calculate metrics based on study habits
    const calculatedData = useMemo(() => {
        if (!stats) return [0, 0, 0, 0, 0, 0];

        // 1. Memory: Flashcard activity (mocked as 50 if no data, increases with logged hours)
        const memory = Math.min(100, 40 + (stats.totalHours * 2));

        // 2. Logic: Task completion vs total
        const totalTasks = (stats.pendingTasks || 0) + (stats.completedTasks || 0);
        const logic = totalTasks > 0 ? (stats.completedTasks / totalTasks) * 100 : 0;

        // 3. Focus: Streak consistency
        const focus = Math.min(100, (stats.streak || 0) * 15);

        // 4. Speed: Task completion rate (Completed tasks relative to total hours)
        const speed = stats.totalHours > 0 ? Math.min(100, (stats.completedTasks / stats.totalHours) * 20) : 0;

        // 5. Visual: Module diversity
        const visual = Math.min(100, (stats.activeModules || 0) * 20);

        // 6. Creativity: Diverse study patterns (Total hours across different modules)
        const creativity = Math.min(100, (stats.totalHours / 2) + (stats.activeModules * 5));

        return [memory, logic, focus, speed, visual, creativity];
    }, [stats]);

    const data = useMemo(() => {
        return {
            labels: ['Memory', 'Logic', 'Focus', 'Speed', 'Visual', 'Creativity'],
            datasets: [
                {
                    label: 'Current Stats',
                    data: calculatedData,
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
    }, [isDarkMode, calculatedData]);

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

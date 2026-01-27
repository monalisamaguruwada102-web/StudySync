import React from 'react';
import {
    format,
    startOfYear,
    eachDayOfInterval,
    isSameDay,
    subDays,
    getDay,
    startOfWeek,
    addDays,
    parseISO
} from 'date-fns';

const Heatmap = ({ logs }) => {
    const today = new Date();
    const last365Days = eachDayOfInterval({
        start: subDays(today, 364),
        end: today
    });

    const getIntensity = (count) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
        if (count < 2) return 'bg-primary-200 dark:bg-primary-900/40 text-primary-900';
        if (count < 4) return 'bg-primary-400 dark:bg-primary-700 text-white';
        if (count < 6) return 'bg-primary-600 dark:bg-primary-600 text-white';
        return 'bg-primary-800 dark:bg-primary-500 text-white';
    };

    // Group logs by week for the grid
    const weeks = [];
    let currentWeek = [];

    // Align start to the beginning of the week
    const firstDay = startOfWeek(last365Days[0]);
    const paddedDays = eachDayOfInterval({
        start: firstDay,
        end: today
    });

    paddedDays.forEach((day, i) => {
        const dayLogs = logs.filter(log => isSameDay(parseISO(log.date), day));
        const totalHours = dayLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);

        currentWeek.push({ day, totalHours });

        if ((i + 1) % 7 === 0 || i === paddedDays.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    return (
        <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-1 min-w-max">
                {/* Day Labels */}
                <div className="flex flex-col justify-between text-[8px] font-bold text-slate-300 pr-2 pt-4">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                        {week.map((dayObj, dayIdx) => (
                            <div
                                key={dayIdx}
                                className={`w-3 h-3 rounded-[2px] ${getIntensity(dayObj.totalHours)} transition-all hover:scale-125 hover:z-10`}
                                title={`${format(dayObj.day, 'PPP')}: ${dayObj.totalHours}h study`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-medium">
                <div className="flex gap-4">
                    <span>{format(subDays(today, 364), 'MMM yyyy')}</span>
                    <span>{format(today, 'MMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-2 h-2 rounded-[1px] bg-slate-100 dark:bg-slate-800" />
                    <div className="w-2 h-2 rounded-[1px] bg-primary-200 dark:bg-primary-900/40" />
                    <div className="w-2 h-2 rounded-[1px] bg-primary-400 dark:bg-primary-700" />
                    <div className="w-2 h-2 rounded-[1px] bg-primary-600 dark:bg-primary-600" />
                    <div className="w-2 h-2 rounded-[1px] bg-primary-800 dark:bg-primary-500" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default Heatmap;

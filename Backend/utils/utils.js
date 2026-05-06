const getDateRange = (filter, customStart, customEnd) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // Helper to get Monday of the current week
    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        return new Date(date.setDate(diff));
    };

    switch (filter) {
        case '7days':
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 7);
            currentEnd = now;

            prevStart = new Date(currentStart);
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd = currentStart;
            break;

        case '30days':
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 30);
            currentEnd = now;

            prevStart = new Date(currentStart);
            prevStart.setDate(prevStart.getDate() - 30);
            prevEnd = currentStart;
            break;
        case "today":
            // Start of today (Midnight)
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate.setHours(0, 0, 0, 0);

            // End of today (11:59 PM)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate.setHours(23, 59, 59, 999);
            break;
        case "this_week":
            // From Monday of this week to Now
            startDate = getMonday(now);
            startDate.setHours(0, 0, 0, 0);
            break;

        case "last_week":
            // From Monday of last week to Sunday of last week
            startDate = getMonday(now);
            startDate.setDate(startDate.getDate() - 7); // Go back 1 week
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Sunday
            endDate.setHours(23, 59, 59, 999);
            break;

        case "this_month":
            // From the 1st of the current month to Now
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            break;

        case "custom":
            // Use the exact dates passed from the frontend
            if (!customStart || !customEnd) {
                throw new Error("Custom start and end dates are required.");
            }
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            break;

        default:
            // Default to last 7 days if no valid filter is provided
            startDate.setDate(now.getDate() - 7);
            break;
    }

    return { startDate, endDate };
};
module.exports = getDateRange
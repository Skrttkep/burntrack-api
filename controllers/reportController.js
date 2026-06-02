const supabase = require('../config/supabase');

const getWeeklyRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const getDateKey = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const getWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = getWeeklyRange();

    const { data: activities, error } = await supabase
      .from('activities')
      .select(
        'id, user_id, activity_type, duration_minutes, calories_burned, steps_count, sedentary_warning, created_at'
      )
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil laporan mingguan',
        error: error.message,
      });
    }

    const totalActivities = activities.length;

    const totalDurationMinutes = activities.reduce(
      (sum, activity) => sum + Number(activity.duration_minutes || 0),
      0
    );

    const totalCalories = activities.reduce(
      (sum, activity) => sum + Number(activity.calories_burned || 0),
      0
    );

    const totalSteps = activities.reduce(
      (sum, activity) => sum + Number(activity.steps_count || 0),
      0
    );

    const totalSedentaryWarnings = activities.filter(
      (activity) => activity.sedentary_warning
    ).length;

    const activityCount = {};

    activities.forEach((activity) => {
      const type = activity.activity_type || 'unknown';
      activityCount[type] = (activityCount[type] || 0) + 1;
    });

    let mostFrequentActivity = null;
    let highestActivityCount = 0;

    Object.entries(activityCount).forEach(([type, count]) => {
      if (count > highestActivityCount) {
        highestActivityCount = count;
        mostFrequentActivity = type;
      }
    });

    const dailyMap = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const key = date.toISOString().split('T')[0];

      dailyMap[key] = {
        date: key,
        totalActivities: 0,
        totalDurationMinutes: 0,
        totalCalories: 0,
        totalSteps: 0,
        sedentaryWarnings: 0,
      };
    }

    activities.forEach((activity) => {
      const key = getDateKey(activity.created_at);

      if (!dailyMap[key]) {
        dailyMap[key] = {
          date: key,
          totalActivities: 0,
          totalDurationMinutes: 0,
          totalCalories: 0,
          totalSteps: 0,
          sedentaryWarnings: 0,
        };
      }

      dailyMap[key].totalActivities += 1;
      dailyMap[key].totalDurationMinutes += Number(activity.duration_minutes || 0);
      dailyMap[key].totalCalories += Number(activity.calories_burned || 0);
      dailyMap[key].totalSteps += Number(activity.steps_count || 0);

      if (activity.sedentary_warning) {
        dailyMap[key].sedentaryWarnings += 1;
      }
    });

    const dailyReport = Object.values(dailyMap);

    const activeDays = dailyReport.filter(
      (day) => day.totalActivities > 0
    ).length;

    const averageCaloriesPerDay = Math.round(totalCalories / 7);
    const averageStepsPerDay = Math.round(totalSteps / 7);
    const averageDurationPerDay = Math.round(totalDurationMinutes / 7);

    return res.status(200).json({
      message: 'Laporan mingguan berhasil diambil',
      report: {
        period: {
          start,
          end,
        },
        totalActivities,
        totalDurationMinutes,
        totalCalories,
        totalSteps,
        totalSedentaryWarnings,
        averageCaloriesPerDay,
        averageStepsPerDay,
        averageDurationPerDay,
        activeDays,
        mostFrequentActivity,
        activityCount,
        dailyReport,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = {
  getWeeklyReport,
};
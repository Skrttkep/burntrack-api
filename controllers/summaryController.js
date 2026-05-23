const supabase = require('../config/supabase');

const getTodayRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    date: now.toISOString().split('T')[0],
  };
};

const getTodaySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end, date } = getTodayRange();

    const { data: todayActivities, error: activityError } = await supabase
      .from('activities')
      .select(
        'id, user_id, activity_type, duration_minutes, weight_kg, calories_burned, steps_count, sedentary_warning, notes, created_at'
      )
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (activityError) {
      return res.status(500).json({
        message: 'Gagal mengambil aktivitas hari ini',
        error: activityError.message,
      });
    }

    const { data: target, error: targetError } = await supabase
      .from('targets')
      .select('id, user_id, target_calories, target_duration_minutes, target_steps, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (targetError) {
      return res.status(500).json({
        message: 'Gagal mengambil target harian',
        error: targetError.message,
      });
    }

    const totalCalories = todayActivities.reduce(
      (sum, activity) => sum + Number(activity.calories_burned || 0),
      0
    );

    const totalDurationMinutes = todayActivities.reduce(
      (sum, activity) => sum + Number(activity.duration_minutes || 0),
      0
    );

    const totalSteps = todayActivities.reduce(
      (sum, activity) => sum + Number(activity.steps_count || 0),
      0
    );

    const sedentaryWarnings = todayActivities.filter(
      (activity) => activity.sedentary_warning
    ).length;

    const formattedTarget = target
      ? {
          id: target.id,
          userId: target.user_id,
          targetCalories: target.target_calories,
          targetDurationMinutes: target.target_duration_minutes,
          targetSteps: target.target_steps,
          createdAt: target.created_at,
          updatedAt: target.updated_at,
        }
      : null;

    const calorieProgress =
      formattedTarget && formattedTarget.targetCalories > 0
        ? Math.round((totalCalories / formattedTarget.targetCalories) * 100)
        : 0;

    const durationProgress =
      formattedTarget && formattedTarget.targetDurationMinutes > 0
        ? Math.round(
            (totalDurationMinutes / formattedTarget.targetDurationMinutes) * 100
          )
        : 0;

    const stepsProgress =
      formattedTarget && formattedTarget.targetSteps > 0
        ? Math.round((totalSteps / formattedTarget.targetSteps) * 100)
        : 0;

    const formattedActivities = todayActivities.map((activity) => ({
      id: activity.id,
      userId: activity.user_id,
      activityType: activity.activity_type,
      durationMinutes: activity.duration_minutes,
      weightKg: activity.weight_kg,
      caloriesBurned: activity.calories_burned,
      stepsCount: activity.steps_count ?? 0,
      sedentaryWarning: activity.sedentary_warning,
      notes: activity.notes,
      createdAt: activity.created_at,
    }));

    return res.status(200).json({
      message: 'Ringkasan aktivitas hari ini berhasil diambil',
      summary: {
        date,
        totalActivities: formattedActivities.length,
        totalCalories,
        totalDurationMinutes,
        totalSteps,
        sedentaryWarnings,
        target: formattedTarget,
        progress: {
          calorieProgress,
          durationProgress,
          stepsProgress,
        },
        activities: formattedActivities,
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
  getTodaySummary,
};
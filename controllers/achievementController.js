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
  };
};

const buildAchievement = ({
  code,
  title,
  description,
  achieved,
  progress,
  target,
}) => {
  const safeProgress = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

  return {
    code,
    title,
    description,
    achieved,
    progress,
    target,
    progressPercentage: achieved ? 100 : safeProgress,
  };
};

const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = getTodayRange();

    const { data: activities, error } = await supabase
      .from('activities')
      .select(
        'id, activity_type, duration_minutes, calories_burned, steps_count, sedentary_warning, created_at'
      )
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil data achievement',
        error: error.message,
      });
    }

    const todayActivities = activities.filter((activity) => {
      const createdAt = new Date(activity.created_at).toISOString();
      return createdAt >= start && createdAt <= end;
    });

    const totalActivities = activities.length;

    const totalCalories = activities.reduce(
      (sum, activity) => sum + Number(activity.calories_burned || 0),
      0
    );

    const totalSteps = activities.reduce(
      (sum, activity) => sum + Number(activity.steps_count || 0),
      0
    );

    const totalDurationMinutes = activities.reduce(
      (sum, activity) => sum + Number(activity.duration_minutes || 0),
      0
    );

    const totalSedentaryWarnings = activities.filter(
      (activity) => activity.sedentary_warning
    ).length;

    const todaySedentaryWarnings = todayActivities.filter(
      (activity) => activity.sedentary_warning
    ).length;

    const hasRunActivity = activities.some(
      (activity) => activity.activity_type === 'lari'
    );

    const hasWalkActivity = activities.some(
      (activity) => activity.activity_type === 'jalan'
    );

    const activeDateSet = new Set(
      activities.map((activity) => {
        return new Date(activity.created_at).toISOString().split('T')[0];
      })
    );

    const activeDays = activeDateSet.size;

    const achievements = [
      buildAchievement({
        code: 'FIRST_ACTIVITY',
        title: 'First Activity',
        description: 'Berhasil menyimpan aktivitas pertama.',
        achieved: totalActivities >= 1,
        progress: totalActivities,
        target: 1,
      }),
      buildAchievement({
        code: 'ACTIVE_USER',
        title: 'Active User',
        description: 'Menyimpan minimal 5 aktivitas.',
        achieved: totalActivities >= 5,
        progress: totalActivities,
        target: 5,
      }),
      buildAchievement({
        code: 'CALORIE_BURNER',
        title: 'Calorie Burner',
        description: 'Membakar total minimal 100 kalori.',
        achieved: totalCalories >= 100,
        progress: totalCalories,
        target: 100,
      }),
      buildAchievement({
        code: 'SUPER_CALORIE_BURNER',
        title: 'Super Calorie Burner',
        description: 'Membakar total minimal 500 kalori.',
        achieved: totalCalories >= 500,
        progress: totalCalories,
        target: 500,
      }),
      buildAchievement({
        code: 'STEP_STARTER',
        title: 'Step Starter',
        description: 'Mencapai total minimal 100 langkah.',
        achieved: totalSteps >= 100,
        progress: totalSteps,
        target: 100,
      }),
      buildAchievement({
        code: 'STEP_MASTER',
        title: 'Step Master',
        description: 'Mencapai total minimal 1000 langkah.',
        achieved: totalSteps >= 1000,
        progress: totalSteps,
        target: 1000,
      }),
      buildAchievement({
        code: 'DURATION_ROOKIE',
        title: 'Duration Rookie',
        description: 'Mencatat total aktivitas minimal 30 menit.',
        achieved: totalDurationMinutes >= 30,
        progress: totalDurationMinutes,
        target: 30,
      }),
      buildAchievement({
        code: 'DURATION_MASTER',
        title: 'Duration Master',
        description: 'Mencatat total aktivitas minimal 120 menit.',
        achieved: totalDurationMinutes >= 120,
        progress: totalDurationMinutes,
        target: 120,
      }),
      buildAchievement({
        code: 'WALKER',
        title: 'Walker',
        description: 'Pernah melakukan aktivitas jalan.',
        achieved: hasWalkActivity,
        progress: hasWalkActivity ? 1 : 0,
        target: 1,
      }),
      buildAchievement({
        code: 'RUNNER',
        title: 'Runner',
        description: 'Pernah melakukan aktivitas lari.',
        achieved: hasRunActivity,
        progress: hasRunActivity ? 1 : 0,
        target: 1,
      }),
      buildAchievement({
        code: 'CONSISTENT_USER',
        title: 'Consistent User',
        description: 'Aktif mencatat aktivitas pada minimal 3 hari berbeda.',
        achieved: activeDays >= 3,
        progress: activeDays,
        target: 3,
      }),
      buildAchievement({
        code: 'NO_SEDENTARY_TODAY',
        title: 'No Sedentary Today',
        description: 'Tidak memiliki sedentary warning hari ini.',
        achieved: todayActivities.length > 0 && todaySedentaryWarnings === 0,
        progress: todayActivities.length > 0 && todaySedentaryWarnings === 0 ? 1 : 0,
        target: 1,
      }),
    ];

    const achievedCount = achievements.filter(
      (achievement) => achievement.achieved
    ).length;

    return res.status(200).json({
      message: 'Achievement berhasil diambil',
      summary: {
        totalAchievements: achievements.length,
        achievedCount,
        lockedCount: achievements.length - achievedCount,
        totalActivities,
        totalCalories,
        totalSteps,
        totalDurationMinutes,
        totalSedentaryWarnings,
        activeDays,
      },
      achievements,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = {
  getAchievements,
};
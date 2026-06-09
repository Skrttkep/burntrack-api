const supabase = require('../config/supabase');

const ACHIEVEMENT_DEFINITIONS = [
  {
    code: 'FIRST_ACTIVITY',
    title: 'First Activity',
    description: 'Berhasil menyimpan aktivitas pertama.',
    target: 1,
    progressKey: 'totalActivities',
  },
  {
    code: 'ACTIVE_USER',
    title: 'Active User',
    description: 'Menyimpan minimal 5 aktivitas.',
    target: 5,
    progressKey: 'totalActivities',
  },
  {
    code: 'CALORIE_BURNER',
    title: 'Calorie Burner',
    description: 'Membakar total minimal 100 kalori.',
    target: 100,
    progressKey: 'totalCalories',
  },
  {
    code: 'SUPER_CALORIE_BURNER',
    title: 'Super Calorie Burner',
    description: 'Membakar total minimal 500 kalori.',
    target: 500,
    progressKey: 'totalCalories',
  },
  {
    code: 'STEP_STARTER',
    title: 'Step Starter',
    description: 'Mencapai total minimal 100 langkah.',
    target: 100,
    progressKey: 'totalSteps',
  },
  {
    code: 'STEP_MASTER',
    title: 'Step Master',
    description: 'Mencapai total minimal 1000 langkah.',
    target: 1000,
    progressKey: 'totalSteps',
  },
  {
    code: 'DURATION_ROOKIE',
    title: 'Duration Rookie',
    description: 'Mencatat total aktivitas minimal 30 menit.',
    target: 30,
    progressKey: 'totalDurationMinutes',
  },
  {
    code: 'DURATION_MASTER',
    title: 'Duration Master',
    description: 'Mencatat total aktivitas minimal 120 menit.',
    target: 120,
    progressKey: 'totalDurationMinutes',
  },
  {
    code: 'WALKER',
    title: 'Walker',
    description: 'Pernah melakukan aktivitas jalan.',
    target: 1,
    progressKey: 'hasWalkActivity',
  },
  {
    code: 'RUNNER',
    title: 'Runner',
    description: 'Pernah melakukan aktivitas lari.',
    target: 1,
    progressKey: 'hasRunActivity',
  },
  {
    code: 'CONSISTENT_USER',
    title: 'Consistent User',
    description: 'Aktif mencatat aktivitas pada minimal 3 hari berbeda.',
    target: 3,
    progressKey: 'activeDays',
  },
  {
    code: 'NO_SEDENTARY_TODAY',
    title: 'No Sedentary Today',
    description:
      'Memiliki aktivitas hari ini tanpa sedentary warning.',
    target: 1,
    progressKey: 'noSedentaryToday',
  },
];

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

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

const getUserActivityStatistics = async (userId) => {
  const { data: activities, error } = await supabase
    .from('activities')
    .select(`
      id,
      activity_type,
      duration_minutes,
      calories_burned,
      steps_count,
      sedentary_warning,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const safeActivities = activities || [];
  const { start, end } = getTodayRange();

  const todayActivities = safeActivities.filter((activity) => {
    if (!activity.created_at) return false;

    const createdAt = new Date(activity.created_at).toISOString();

    return createdAt >= start && createdAt <= end;
  });

  const totalActivities = safeActivities.length;

  const totalCalories = safeActivities.reduce(
    (total, activity) =>
      total + numberValue(activity.calories_burned),
    0,
  );

  const totalSteps = safeActivities.reduce(
    (total, activity) =>
      total + numberValue(activity.steps_count),
    0,
  );

  const totalDurationMinutes = safeActivities.reduce(
    (total, activity) =>
      total + numberValue(activity.duration_minutes),
    0,
  );

  const totalSedentaryWarnings = safeActivities.filter(
    (activity) => activity.sedentary_warning === true,
  ).length;

  const todaySedentaryWarnings = todayActivities.filter(
    (activity) => activity.sedentary_warning === true,
  ).length;

  const hasWalkActivity = safeActivities.some(
    (activity) => activity.activity_type === 'jalan',
  )
    ? 1
    : 0;

  const hasRunActivity = safeActivities.some(
    (activity) => activity.activity_type === 'lari',
  )
    ? 1
    : 0;

  const activeDates = new Set(
    safeActivities
      .filter((activity) => activity.created_at)
      .map((activity) => {
        return new Date(activity.created_at)
          .toISOString()
          .split('T')[0];
      }),
  );

  const noSedentaryToday =
    todayActivities.length > 0 &&
    todaySedentaryWarnings === 0
      ? 1
      : 0;

  return {
    totalActivities,
    totalCalories,
    totalSteps,
    totalDurationMinutes,
    totalSedentaryWarnings,
    todaySedentaryWarnings,
    hasWalkActivity,
    hasRunActivity,
    activeDays: activeDates.size,
    noSedentaryToday,
  };
};

const saveUnlockedAchievement = async ({
  userId,
  definition,
}) => {
  const { error } = await supabase
    .from('user_achievements')
    .upsert(
      {
        user_id: userId,
        achievement_code: definition.code,
        achievement_title: definition.title,
        achievement_description: definition.description,
      },
      {
        onConflict: 'user_id,achievement_code',
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(error.message);
  }
};

const syncAchievementsForUser = async (userId) => {
  const statistics = await getUserActivityStatistics(userId);

  const unlockedDefinitions =
    ACHIEVEMENT_DEFINITIONS.filter((definition) => {
      const progress = numberValue(
        statistics[definition.progressKey],
      );

      return progress >= definition.target;
    });

  for (const definition of unlockedDefinitions) {
    await saveUnlockedAchievement({
      userId,
      definition,
    });
  }

  return statistics;
};

const getStoredAchievements = async (userId) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      id,
      user_id,
      achievement_code,
      achievement_title,
      achievement_description,
      is_claimed,
      achieved_at,
      created_at
    `)
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    const statistics =
      await syncAchievementsForUser(userId);

    const storedAchievements =
      await getStoredAchievements(userId);

    const storedAchievementMap = new Map(
      storedAchievements.map((achievement) => [
        achievement.achievement_code,
        achievement,
      ]),
    );

    const achievements = ACHIEVEMENT_DEFINITIONS.map(
      (definition) => {
        const progress = numberValue(
          statistics[definition.progressKey],
        );

        const achieved = progress >= definition.target;
        const storedAchievement =
          storedAchievementMap.get(definition.code);

        const percentage =
          definition.target > 0
            ? Math.min(
                100,
                Math.round(
                  (progress / definition.target) * 100,
                ),
              )
            : 0;

        return {
          id: storedAchievement?.id ?? null,
          code: definition.code,
          title: definition.title,
          description: definition.description,
          achieved,
          isClaimed:
            storedAchievement?.is_claimed ?? false,
          achievedAt:
            storedAchievement?.achieved_at ?? null,
          progress,
          target: definition.target,
          progressPercentage: achieved ? 100 : percentage,
        };
      },
    );

    const achievedCount = achievements.filter(
      (achievement) => achievement.achieved,
    ).length;

    const claimedCount = achievements.filter(
      (achievement) =>
        achievement.achieved &&
        achievement.isClaimed,
    ).length;

    const unclaimedCount = achievements.filter(
      (achievement) =>
        achievement.achieved &&
        !achievement.isClaimed,
    ).length;

    return res.status(200).json({
      message: 'Achievement berhasil diambil',
      summary: {
        totalAchievements: achievements.length,
        achievedCount,
        claimedCount,
        unclaimedCount,
        lockedCount:
          achievements.length - achievedCount,
        totalActivities: statistics.totalActivities,
        totalCalories: statistics.totalCalories,
        totalSteps: statistics.totalSteps,
        totalDurationMinutes:
          statistics.totalDurationMinutes,
        totalSedentaryWarnings:
          statistics.totalSedentaryWarnings,
        activeDays: statistics.activeDays,
      },
      achievements,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Gagal mengambil achievement',
      error: error.message,
    });
  }
};

const getAchievementHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await syncAchievementsForUser(userId);

    const storedAchievements =
      await getStoredAchievements(userId);

    const achievements = storedAchievements.map(
      (achievement) => ({
        id: achievement.id,
        userId: achievement.user_id,
        code: achievement.achievement_code,
        title: achievement.achievement_title,
        description:
          achievement.achievement_description,
        isClaimed: achievement.is_claimed,
        achievedAt: achievement.achieved_at,
        createdAt: achievement.created_at,
      }),
    );

    return res.status(200).json({
      message:
        'Riwayat achievement berhasil diambil',
      total: achievements.length,
      achievements,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        'Gagal mengambil riwayat achievement',
      error: error.message,
    });
  }
};

const claimAchievement = async (req, res) => {
  try {
    const userId = req.user.id;
    const achievementId = Number(req.params.id);

    if (
      !Number.isInteger(achievementId) ||
      achievementId <= 0
    ) {
      return res.status(400).json({
        message: 'ID achievement tidak valid',
      });
    }

    await syncAchievementsForUser(userId);

    const {
      data: existingAchievement,
      error: findError,
    } = await supabase
      .from('user_achievements')
      .select(`
        id,
        user_id,
        achievement_code,
        achievement_title,
        achievement_description,
        is_claimed,
        achieved_at,
        created_at
      `)
      .eq('id', achievementId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        message: 'Gagal mengecek achievement',
        error: findError.message,
      });
    }

    if (!existingAchievement) {
      return res.status(404).json({
        message:
          'Achievement tidak ditemukan atau bukan milik user',
      });
    }

    if (existingAchievement.is_claimed) {
      return res.status(200).json({
        message:
          'Achievement sebelumnya sudah diklaim',
        achievement: {
          id: existingAchievement.id,
          userId: existingAchievement.user_id,
          code:
            existingAchievement.achievement_code,
          title:
            existingAchievement.achievement_title,
          description:
            existingAchievement
              .achievement_description,
          isClaimed:
            existingAchievement.is_claimed,
          achievedAt:
            existingAchievement.achieved_at,
          createdAt:
            existingAchievement.created_at,
        },
      });
    }

    const {
      data: updatedAchievement,
      error: updateError,
    } = await supabase
      .from('user_achievements')
      .update({
        is_claimed: true,
      })
      .eq('id', achievementId)
      .eq('user_id', userId)
      .select(`
        id,
        user_id,
        achievement_code,
        achievement_title,
        achievement_description,
        is_claimed,
        achieved_at,
        created_at
      `)
      .single();

    if (updateError) {
      return res.status(500).json({
        message: 'Gagal mengklaim achievement',
        error: updateError.message,
      });
    }

    return res.status(200).json({
      message: 'Achievement berhasil diklaim',
      achievement: {
        id: updatedAchievement.id,
        userId: updatedAchievement.user_id,
        code:
          updatedAchievement.achievement_code,
        title:
          updatedAchievement.achievement_title,
        description:
          updatedAchievement
            .achievement_description,
        isClaimed:
          updatedAchievement.is_claimed,
        achievedAt:
          updatedAchievement.achieved_at,
        createdAt:
          updatedAchievement.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Gagal mengklaim achievement',
      error: error.message,
    });
  }
};

module.exports = {
  getAchievements,
  getAchievementHistory,
  claimAchievement,
  syncAchievementsForUser,
};
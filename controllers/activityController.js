const supabase = require('../config/supabase');

const {
  syncAchievementsForUser,
} = require('./achievementController');

const ALLOWED_ACTIVITY_TYPES = [
  'diam',
  'jalan',
  'lari',
  'bersepeda',
  'olahraga_ringan',
];

const MET_VALUES = {
  diam: 1.3,
  jalan: 3.5,
  lari: 8.0,
  bersepeda: 6.8,
  olahraga_ringan: 4.0,
};

const STEPS_PER_MINUTE = {
  diam: 0,
  jalan: 100,
  lari: 160,
  bersepeda: 0,
  olahraga_ringan: 70,
};

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const calculateCalories = (
  activityType,
  durationMinutes,
  weightKg,
) => {
  const met = MET_VALUES[activityType] || 3.5;

  const durationHours =
    numberValue(durationMinutes) / 60;

  return Math.max(
    0,
    Math.round(
      met *
        numberValue(weightKg) *
        durationHours,
    ),
  );
};

const calculateSteps = (
  activityType,
  durationMinutes,
) => {
  const stepRate =
    STEPS_PER_MINUTE[activityType] || 0;

  return Math.max(
    0,
    Math.round(
      stepRate * numberValue(durationMinutes),
    ),
  );
};

const formatActivity = (activity) => {
  return {
    id: activity.id,
    userId: activity.user_id,
    activityType: activity.activity_type,
    durationMinutes:
      activity.duration_minutes,
    weightKg: activity.weight_kg,
    caloriesBurned:
      activity.calories_burned,
    stepsCount: activity.steps_count ?? 0,
    sedentaryWarning:
      activity.sedentary_warning,
    notes: activity.notes,
    createdAt: activity.created_at,
  };
};

const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      activityType,
      durationMinutes,
      weightKg,
      stepsCount,
      notes,
    } = req.body;

    if (
      !activityType ||
      durationMinutes === undefined ||
      weightKg === undefined
    ) {
      return res.status(400).json({
        message:
          'Jenis aktivitas, durasi, dan berat badan wajib diisi',
      });
    }

    if (
      !ALLOWED_ACTIVITY_TYPES.includes(
        activityType,
      )
    ) {
      return res.status(400).json({
        message: 'Jenis aktivitas tidak valid',
        allowedActivityTypes:
          ALLOWED_ACTIVITY_TYPES,
      });
    }

    const finalDurationMinutes =
      numberValue(durationMinutes);

    const finalWeightKg =
      numberValue(weightKg);

    if (finalDurationMinutes <= 0) {
      return res.status(400).json({
        message:
          'Durasi aktivitas harus lebih dari 0 menit',
      });
    }

    if (finalWeightKg <= 0) {
      return res.status(400).json({
        message:
          'Berat badan harus lebih dari 0 kg',
      });
    }

    const caloriesBurned = calculateCalories(
      activityType,
      finalDurationMinutes,
      finalWeightKg,
    );

    const finalStepsCount =
      stepsCount !== undefined &&
      stepsCount !== null
        ? Math.max(
            0,
            Math.round(numberValue(stepsCount)),
          )
        : calculateSteps(
            activityType,
            finalDurationMinutes,
          );

    const sedentaryWarning =
      activityType === 'diam' &&
      finalDurationMinutes >= 60;

    const { data: newActivity, error } =
      await supabase
        .from('activities')
        .insert([
          {
            user_id: userId,
            activity_type: activityType,
            duration_minutes:
              finalDurationMinutes,
            weight_kg: finalWeightKg,
            calories_burned:
              caloriesBurned,
            steps_count: finalStepsCount,
            sedentary_warning:
              sedentaryWarning,
            notes: notes || '',
          },
        ])
        .select(`
          id,
          user_id,
          activity_type,
          duration_minutes,
          weight_kg,
          calories_burned,
          steps_count,
          sedentary_warning,
          notes,
          created_at
        `)
        .single();

    if (error) {
      return res.status(500).json({
        message:
          'Gagal menambahkan aktivitas',
        error: error.message,
      });
    }

    let achievementSync = {
      success: true,
      message:
        'Pengecekan achievement berhasil',
    };

    try {
      await syncAchievementsForUser(userId);
    } catch (achievementError) {
      console.error(
        'Achievement sync error:',
        achievementError.message,
      );

      achievementSync = {
        success: false,
        message:
          'Aktivitas tersimpan, tetapi pengecekan achievement gagal',
        error: achievementError.message,
      };
    }

    return res.status(201).json({
      message:
        'Aktivitas berhasil ditambahkan',
      activity: formatActivity(newActivity),
      achievementSync,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: activities, error } =
      await supabase
        .from('activities')
        .select(`
          id,
          user_id,
          activity_type,
          duration_minutes,
          weight_kg,
          calories_burned,
          steps_count,
          sedentary_warning,
          notes,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      return res.status(500).json({
        message:
          'Gagal mengambil data aktivitas',
        error: error.message,
      });
    }

    const formattedActivities =
      (activities || []).map(formatActivity);

    return res.status(200).json({
      message:
        'Data aktivitas berhasil diambil',
      total: formattedActivities.length,
      activities: formattedActivities,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getActivityById = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = Number(req.params.id);

    if (
      !Number.isInteger(activityId) ||
      activityId <= 0
    ) {
      return res.status(400).json({
        message: 'ID aktivitas tidak valid',
      });
    }

    const { data: activity, error } =
      await supabase
        .from('activities')
        .select(`
          id,
          user_id,
          activity_type,
          duration_minutes,
          weight_kg,
          calories_burned,
          steps_count,
          sedentary_warning,
          notes,
          created_at
        `)
        .eq('id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
      return res.status(500).json({
        message:
          'Gagal mengambil detail aktivitas',
        error: error.message,
      });
    }

    if (!activity) {
      return res.status(404).json({
        message:
          'Aktivitas tidak ditemukan',
      });
    }

    return res.status(200).json({
      message:
        'Detail aktivitas berhasil diambil',
      activity: formatActivity(activity),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = Number(req.params.id);

    if (
      !Number.isInteger(activityId) ||
      activityId <= 0
    ) {
      return res.status(400).json({
        message: 'ID aktivitas tidak valid',
      });
    }

    const {
      data: deletedActivity,
      error,
    } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId)
      .select(`
        id,
        user_id,
        activity_type,
        duration_minutes,
        weight_kg,
        calories_burned,
        steps_count,
        sedentary_warning,
        notes,
        created_at
      `)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        message:
          'Gagal menghapus aktivitas',
        error: error.message,
      });
    }

    if (!deletedActivity) {
      return res.status(404).json({
        message:
          'Aktivitas tidak ditemukan atau bukan milik user',
      });
    }

    return res.status(200).json({
      message:
        'Aktivitas berhasil dihapus',
      activity:
        formatActivity(deletedActivity),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
  calculateCalories,
  calculateSteps,
};
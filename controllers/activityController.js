const supabase = require('../config/supabase');

const calculateCalories = (activityType, durationMinutes, weightKg) => {
  const metValues = {
    diam: 1.3,
    jalan: 3.5,
    lari: 8.0,
    bersepeda: 6.8,
    olahraga_ringan: 4.0,
  };

  const met = metValues[activityType] || 3.5;
  const durationHours = durationMinutes / 60;
  const calories = met * weightKg * durationHours;

  return Math.round(calories);
};

const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      activityType,
      durationMinutes,
      weightKg,
      notes,
    } = req.body;

    if (!activityType || !durationMinutes || !weightKg) {
      return res.status(400).json({
        message: 'Jenis aktivitas, durasi, dan berat badan wajib diisi',
      });
    }

    if (Number(durationMinutes) <= 0) {
      return res.status(400).json({
        message: 'Durasi aktivitas harus lebih dari 0 menit',
      });
    }

    if (Number(weightKg) <= 0) {
      return res.status(400).json({
        message: 'Berat badan harus lebih dari 0 kg',
      });
    }

    const caloriesBurned = calculateCalories(
      activityType,
      Number(durationMinutes),
      Number(weightKg)
    );

    const sedentaryWarning =
      activityType === 'diam' && Number(durationMinutes) >= 60;

    const { data: newActivity, error } = await supabase
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          duration_minutes: Number(durationMinutes),
          weight_kg: Number(weightKg),
          calories_burned: caloriesBurned,
          sedentary_warning: sedentaryWarning,
          notes: notes || '',
        },
      ])
      .select(
        'id, user_id, activity_type, duration_minutes, weight_kg, calories_burned, sedentary_warning, notes, created_at'
      )
      .single();

    if (error) {
      return res.status(500).json({
        message: 'Gagal menambahkan aktivitas',
        error: error.message,
      });
    }

    return res.status(201).json({
      message: 'Aktivitas berhasil ditambahkan',
      activity: {
        id: newActivity.id,
        userId: newActivity.user_id,
        activityType: newActivity.activity_type,
        durationMinutes: newActivity.duration_minutes,
        weightKg: newActivity.weight_kg,
        caloriesBurned: newActivity.calories_burned,
        sedentaryWarning: newActivity.sedentary_warning,
        notes: newActivity.notes,
        createdAt: newActivity.created_at,
      },
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

    const { data: activities, error } = await supabase
      .from('activities')
      .select(
        'id, user_id, activity_type, duration_minutes, weight_kg, calories_burned, sedentary_warning, notes, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil data aktivitas',
        error: error.message,
      });
    }

    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      userId: activity.user_id,
      activityType: activity.activity_type,
      durationMinutes: activity.duration_minutes,
      weightKg: activity.weight_kg,
      caloriesBurned: activity.calories_burned,
      sedentaryWarning: activity.sedentary_warning,
      notes: activity.notes,
      createdAt: activity.created_at,
    }));

    return res.status(200).json({
      message: 'Data aktivitas berhasil diambil',
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

    const { data: activity, error } = await supabase
      .from('activities')
      .select(
        'id, user_id, activity_type, duration_minutes, weight_kg, calories_burned, sedentary_warning, notes, created_at'
      )
      .eq('id', activityId)
      .eq('user_id', userId)
      .single();

    if (error || !activity) {
      return res.status(404).json({
        message: 'Aktivitas tidak ditemukan',
      });
    }

    return res.status(200).json({
      message: 'Detail aktivitas berhasil diambil',
      activity: {
        id: activity.id,
        userId: activity.user_id,
        activityType: activity.activity_type,
        durationMinutes: activity.duration_minutes,
        weightKg: activity.weight_kg,
        caloriesBurned: activity.calories_burned,
        sedentaryWarning: activity.sedentary_warning,
        notes: activity.notes,
        createdAt: activity.created_at,
      },
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

    const { data: deletedActivity, error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId)
      .select(
        'id, user_id, activity_type, duration_minutes, weight_kg, calories_burned, sedentary_warning, notes, created_at'
      )
      .single();

    if (error || !deletedActivity) {
      return res.status(404).json({
        message: 'Aktivitas tidak ditemukan atau gagal dihapus',
      });
    }

    return res.status(200).json({
      message: 'Aktivitas berhasil dihapus',
      activity: {
        id: deletedActivity.id,
        userId: deletedActivity.user_id,
        activityType: deletedActivity.activity_type,
        durationMinutes: deletedActivity.duration_minutes,
        weightKg: deletedActivity.weight_kg,
        caloriesBurned: deletedActivity.calories_burned,
        sedentaryWarning: deletedActivity.sedentary_warning,
        notes: deletedActivity.notes,
        createdAt: deletedActivity.created_at,
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
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
  calculateCalories,
};
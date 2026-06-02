const supabase = require('../config/supabase');

const formatUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    weight: user.weight,
    height: user.height,
    role: user.role || 'user',
    createdAt: user.created_at,
  };
};

const formatActivity = (activity) => {
  return {
    id: activity.id,
    userId: activity.user_id,
    userName: activity.users?.name || null,
    userEmail: activity.users?.email || null,
    activityType: activity.activity_type,
    durationMinutes: activity.duration_minutes,
    weightKg: activity.weight_kg,
    caloriesBurned: activity.calories_burned,
    stepsCount: activity.steps_count ?? 0,
    sedentaryWarning: activity.sedentary_warning,
    notes: activity.notes,
    createdAt: activity.created_at,
  };
};

const getAdminSummary = async (req, res) => {
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, role');

    if (userError) {
      return res.status(500).json({
        message: 'Gagal mengambil data user',
        error: userError.message,
      });
    }

    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select('id, activity_type, duration_minutes, calories_burned, steps_count, sedentary_warning, created_at');

    if (activityError) {
      return res.status(500).json({
        message: 'Gagal mengambil data aktivitas',
        error: activityError.message,
      });
    }

    const totalUsers = users.length;
    const totalAdmins = users.filter((user) => user.role === 'admin').length;
    const totalRegularUsers = users.filter((user) => user.role !== 'admin').length;

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

    const activityCount = {
      diam: 0,
      jalan: 0,
      lari: 0,
      bersepeda: 0,
      olahraga_ringan: 0,
    };

    activities.forEach((activity) => {
      const type = activity.activity_type || 'unknown';
      activityCount[type] = (activityCount[type] || 0) + 1;
    });

    let mostFrequentActivity = null;
    let highestCount = 0;

    Object.entries(activityCount).forEach(([type, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostFrequentActivity = type;
      }
    });

    return res.status(200).json({
      message: 'Ringkasan admin berhasil diambil',
      summary: {
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        totalActivities,
        totalDurationMinutes,
        totalCalories,
        totalSteps,
        totalSedentaryWarnings,
        mostFrequentActivity,
        activityCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, age, weight, height, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil daftar user',
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Daftar user berhasil diambil',
      total: users.length,
      users: users.map(formatUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, age, weight, height, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      message: 'Detail user berhasil diambil',
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const { data: activities, error } = await supabase
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
        created_at,
        users (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil semua aktivitas',
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Data semua aktivitas berhasil diambil',
      total: activities.length,
      activities: activities.map(formatActivity),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getUserStatistics = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, age, weight, height, role, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        message: 'User tidak ditemukan',
      });
    }

    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select('id, activity_type, duration_minutes, calories_burned, steps_count, sedentary_warning, created_at')
      .eq('user_id', userId);

    if (activityError) {
      return res.status(500).json({
        message: 'Gagal mengambil statistik user',
        error: activityError.message,
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

    let favoriteActivity = null;
    let highestCount = 0;

    Object.entries(activityCount).forEach(([type, count]) => {
      if (count > highestCount) {
        highestCount = count;
        favoriteActivity = type;
      }
    });

    return res.status(200).json({
      message: 'Statistik user berhasil diambil',
      user: formatUser(user),
      statistics: {
        totalActivities,
        totalDurationMinutes,
        totalCalories,
        totalSteps,
        totalSedentaryWarnings,
        favoriteActivity,
        activityCount,
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
  getAdminSummary,
  getAllUsers,
  getUserDetail,
  getAllActivities,
  getUserStatistics,
};
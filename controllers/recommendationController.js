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

const getTodayRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end, date } = getTodayRange();

    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select(
        'id, activity_type, duration_minutes, calories_burned, steps_count, sedentary_warning, created_at'
      )
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (activityError) {
      return res.status(500).json({
        message: 'Gagal mengambil data aktivitas hari ini',
        error: activityError.message,
      });
    }

    const { data: target, error: targetError } = await supabase
      .from('targets')
      .select('id, target_calories, target_duration_minutes, target_steps')
      .eq('user_id', userId)
      .maybeSingle();

    if (targetError) {
      return res.status(500).json({
        message: 'Gagal mengambil target harian',
        error: targetError.message,
      });
    }

    const totalCalories = activities.reduce(
      (sum, activity) => sum + Number(activity.calories_burned || 0),
      0
    );

    const totalDurationMinutes = activities.reduce(
      (sum, activity) => sum + Number(activity.duration_minutes || 0),
      0
    );

    const totalSteps = activities.reduce(
      (sum, activity) => sum + Number(activity.steps_count || 0),
      0
    );

    const sedentaryWarnings = activities.filter(
      (activity) => activity.sedentary_warning
    ).length;

    const recommendations = [];

    if (!target) {
      recommendations.push({
        type: 'target',
        priority: 'high',
        title: 'Atur Target Harian',
        message:
          'Kamu belum mengatur target harian. Atur target kalori, durasi, dan langkah agar progress kesehatan bisa dipantau.',
      });

      return res.status(200).json({
        message: 'Rekomendasi berhasil dibuat',
        date,
        summary: {
          totalCalories,
          totalDurationMinutes,
          totalSteps,
          sedentaryWarnings,
        },
        target: null,
        recommendations,
      });
    }

    const targetCalories = Number(target.target_calories || 0);
    const targetDurationMinutes = Number(target.target_duration_minutes || 0);
    const targetSteps = Number(target.target_steps || 0);

    const calorieProgress =
      targetCalories > 0 ? Math.round((totalCalories / targetCalories) * 100) : 0;

    const durationProgress =
      targetDurationMinutes > 0
        ? Math.round((totalDurationMinutes / targetDurationMinutes) * 100)
        : 0;

    const stepsProgress =
      targetSteps > 0 ? Math.round((totalSteps / targetSteps) * 100) : 0;

    if (targetSteps > 0 && totalSteps < targetSteps) {
      const remainingSteps = targetSteps - totalSteps;

      recommendations.push({
        type: 'steps',
        priority: remainingSteps > 500 ? 'high' : 'medium',
        title: 'Target Langkah Belum Tercapai',
        message: `Kamu masih kurang ${remainingSteps} langkah dari target hari ini. Coba berjalan kaki beberapa menit.`,
      });
    }

    if (targetCalories > 0 && totalCalories < targetCalories) {
      const remainingCalories = targetCalories - totalCalories;

      recommendations.push({
        type: 'calories',
        priority: remainingCalories > 100 ? 'high' : 'medium',
        title: 'Target Kalori Belum Tercapai',
        message: `Kamu masih perlu membakar sekitar ${remainingCalories} kalori. Aktivitas jalan cepat atau lari ringan dapat membantu.`,
      });
    }

    if (targetDurationMinutes > 0 && totalDurationMinutes < targetDurationMinutes) {
      const remainingDuration = targetDurationMinutes - totalDurationMinutes;

      recommendations.push({
        type: 'duration',
        priority: remainingDuration > 30 ? 'high' : 'medium',
        title: 'Durasi Aktivitas Masih Kurang',
        message: `Durasi aktivitasmu masih kurang ${remainingDuration} menit. Tambahkan aktivitas ringan agar target tercapai.`,
      });
    }

    if (sedentaryWarnings > 0) {
      recommendations.push({
        type: 'sedentary',
        priority: 'high',
        title: 'Peringatan Terlalu Lama Diam',
        message:
          'Hari ini terdapat sedentary warning. Kurangi waktu diam terlalu lama dengan melakukan peregangan atau berjalan singkat.',
      });
    }

    if (
      targetCalories > 0 &&
      targetDurationMinutes > 0 &&
      targetSteps > 0 &&
      totalCalories >= targetCalories &&
      totalDurationMinutes >= targetDurationMinutes &&
      totalSteps >= targetSteps &&
      sedentaryWarnings === 0
    ) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        title: 'Target Hari Ini Tercapai',
        message:
          'Mantap! Target kalori, durasi, dan langkah hari ini sudah tercapai. Pertahankan pola aktivitas sehatmu.',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        priority: 'low',
        title: 'Aktivitas Sudah Baik',
        message:
          'Aktivitasmu hari ini sudah cukup baik. Tetap pantau progress dan hindari terlalu lama diam.',
      });
    }

    return res.status(200).json({
      message: 'Rekomendasi berhasil dibuat',
      date,
      summary: {
        totalCalories,
        totalDurationMinutes,
        totalSteps,
        sedentaryWarnings,
      },
      target: {
        targetCalories,
        targetDurationMinutes,
        targetSteps,
      },
      progress: {
        calorieProgress,
        durationProgress,
        stepsProgress,
      },
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = {
  getTodayRecommendations,
};
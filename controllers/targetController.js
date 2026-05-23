const supabase = require('../config/supabase');

const createOrUpdateTarget = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      targetCalories,
      targetDurationMinutes,
      targetSteps,
    } = req.body;

    if (
      targetCalories === undefined &&
      targetDurationMinutes === undefined &&
      targetSteps === undefined
    ) {
      return res.status(400).json({
        message: 'Minimal salah satu target harus diisi',
      });
    }

    const { data: existingTarget, error: checkError } = await supabase
      .from('targets')
      .select('id, user_id, target_calories, target_duration_minutes, target_steps, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({
        message: 'Gagal mengecek target harian',
        error: checkError.message,
      });
    }

    if (!existingTarget) {
      const { data: newTarget, error: insertError } = await supabase
        .from('targets')
        .insert([
          {
            user_id: userId,
            target_calories: targetCalories || 0,
            target_duration_minutes: targetDurationMinutes || 0,
            target_steps: targetSteps || 0,
          },
        ])
        .select('id, user_id, target_calories, target_duration_minutes, target_steps, created_at, updated_at')
        .single();

      if (insertError) {
        return res.status(500).json({
          message: 'Gagal membuat target harian',
          error: insertError.message,
        });
      }

      return res.status(201).json({
        message: 'Target harian berhasil dibuat',
        target: {
          id: newTarget.id,
          userId: newTarget.user_id,
          targetCalories: newTarget.target_calories,
          targetDurationMinutes: newTarget.target_duration_minutes,
          targetSteps: newTarget.target_steps,
          createdAt: newTarget.created_at,
          updatedAt: newTarget.updated_at,
        },
      });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (targetCalories !== undefined) {
      updateData.target_calories = Number(targetCalories);
    }

    if (targetDurationMinutes !== undefined) {
      updateData.target_duration_minutes = Number(targetDurationMinutes);
    }

    if (targetSteps !== undefined) {
      updateData.target_steps = Number(targetSteps);
    }

    const { data: updatedTarget, error: updateError } = await supabase
      .from('targets')
      .update(updateData)
      .eq('id', existingTarget.id)
      .eq('user_id', userId)
      .select('id, user_id, target_calories, target_duration_minutes, target_steps, created_at, updated_at')
      .single();

    if (updateError) {
      return res.status(500).json({
        message: 'Gagal memperbarui target harian',
        error: updateError.message,
      });
    }

    return res.status(200).json({
      message: 'Target harian berhasil diperbarui',
      target: {
        id: updatedTarget.id,
        userId: updatedTarget.user_id,
        targetCalories: updatedTarget.target_calories,
        targetDurationMinutes: updatedTarget.target_duration_minutes,
        targetSteps: updatedTarget.target_steps,
        createdAt: updatedTarget.created_at,
        updatedAt: updatedTarget.updated_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const getTarget = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: target, error } = await supabase
      .from('targets')
      .select('id, user_id, target_calories, target_duration_minutes, target_steps, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil target harian',
        error: error.message,
      });
    }

    if (!target) {
      return res.status(404).json({
        message: 'Target harian belum dibuat',
        target: null,
      });
    }

    return res.status(200).json({
      message: 'Target harian berhasil diambil',
      target: {
        id: target.id,
        userId: target.user_id,
        targetCalories: target.target_calories,
        targetDurationMinutes: target.target_duration_minutes,
        targetSteps: target.target_steps,
        createdAt: target.created_at,
        updatedAt: target.updated_at,
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
  createOrUpdateTarget,
  getTarget,
};
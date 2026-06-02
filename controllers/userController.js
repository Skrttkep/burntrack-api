const supabase = require('../config/supabase');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, age, weight, height, role, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil profile',
        error: error.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      message: 'Profile berhasil diambil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        role: user.role || 'user',
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, age, weight, height } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Tidak ada data yang diperbarui',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, age, weight, height, role, created_at')
      .single();

    if (error) {
      return res.status(500).json({
        message: 'Gagal memperbarui profile',
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Profile berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        role: user.role || 'user',
        createdAt: user.created_at,
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
  getProfile,
  updateProfile,
};
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BurnTrack API',
    version: '1.2.0',
    description:
      'Dokumentasi REST API BurnTrack untuk autentikasi, profile, aktivitas, target harian, summary, admin, laporan mingguan, rekomendasi aktivitas, dan achievement.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development',
    },
    {
      url: 'https://burntrack-api.vercel.app',
      description: 'Vercel Production',
    },
  ],
  tags: [
    {
      name: 'Root',
      description: 'Cek status API',
    },
    {
      name: 'Auth',
      description: 'Registrasi dan login user',
    },
    {
      name: 'User',
      description: 'Profile user yang sedang login',
    },
    {
      name: 'Activities',
      description: 'Aktivitas user yang sedang login',
    },
    {
      name: 'Targets',
      description: 'Target harian user',
    },
    {
      name: 'Summary',
      description: 'Ringkasan aktivitas user hari ini',
    },
    {
      name: 'Reports',
      description: 'Laporan aktivitas user',
    },
    {
      name: 'Recommendations',
      description: 'Rekomendasi cerdas berdasarkan aktivitas dan target',
    },
    {
      name: 'Achievements',
      description: 'Badge pencapaian user',
    },
    {
      name: 'Admin',
      description: 'Endpoint khusus admin',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'age', 'weight', 'height'],
        properties: {
          name: {
            type: 'string',
            example: 'Mario User',
          },
          email: {
            type: 'string',
            example: 'user@burntrack.com',
          },
          password: {
            type: 'string',
            example: '123456',
          },
          age: {
            type: 'integer',
            example: 21,
          },
          weight: {
            type: 'number',
            example: 60,
          },
          height: {
            type: 'number',
            example: 170,
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            example: 'user@burntrack.com',
          },
          password: {
            type: 'string',
            example: '123456',
          },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Mario Adi',
          },
          age: {
            type: 'integer',
            example: 21,
          },
          weight: {
            type: 'number',
            example: 62,
          },
          height: {
            type: 'number',
            example: 170,
          },
        },
      },
      CreateActivityRequest: {
        type: 'object',
        required: ['activityType', 'durationMinutes', 'weightKg'],
        properties: {
          activityType: {
            type: 'string',
            example: 'jalan',
            enum: ['diam', 'jalan', 'lari', 'bersepeda', 'olahraga_ringan'],
          },
          durationMinutes: {
            type: 'integer',
            example: 5,
          },
          weightKg: {
            type: 'number',
            example: 60,
          },
          stepsCount: {
            type: 'integer',
            example: 20,
          },
          notes: {
            type: 'string',
            example: 'Aktivitas dari sensor accelerometer',
          },
        },
      },
      TargetRequest: {
        type: 'object',
        properties: {
          targetCalories: {
            type: 'integer',
            example: 500,
          },
          targetDurationMinutes: {
            type: 'integer',
            example: 60,
          },
          targetSteps: {
            type: 'integer',
            example: 1000,
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Root'],
        summary: 'Cek status API',
        responses: {
          200: {
            description: 'API berhasil berjalan',
          },
        },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrasi user baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registrasi berhasil',
          },
          400: {
            description: 'Data tidak lengkap',
          },
          409: {
            description: 'Email sudah terdaftar',
          },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user atau admin',
        description:
          'Gunakan token dari response login untuk endpoint yang membutuhkan Authorization Bearer Token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login berhasil',
          },
          400: {
            description: 'Email dan password wajib diisi',
          },
          401: {
            description: 'Email atau password salah',
          },
        },
      },
    },

    '/api/users/profile': {
      get: {
        tags: ['User'],
        summary: 'Mengambil profile user login',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Profile berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update profile user login',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProfileRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile berhasil diperbarui',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/activities': {
      post: {
        tags: ['Activities'],
        summary: 'Menambahkan aktivitas',
        description:
          'Menyimpan aktivitas user. Kalori dihitung oleh API, sedangkan stepsCount dapat dikirim dari hasil deteksi sensor Flutter.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateActivityRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Aktivitas berhasil ditambahkan',
          },
          400: {
            description: 'Data aktivitas tidak lengkap',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
      get: {
        tags: ['Activities'],
        summary: 'Mengambil riwayat aktivitas user login',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Data aktivitas berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/activities/{id}': {
      get: {
        tags: ['Activities'],
        summary: 'Mengambil detail aktivitas',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Detail aktivitas berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          404: {
            description: 'Aktivitas tidak ditemukan',
          },
        },
      },
      delete: {
        tags: ['Activities'],
        summary: 'Menghapus aktivitas',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Aktivitas berhasil dihapus',
          },
          401: {
            description: 'Token tidak valid',
          },
          404: {
            description: 'Aktivitas tidak ditemukan',
          },
        },
      },
    },

    '/api/targets': {
      post: {
        tags: ['Targets'],
        summary: 'Membuat atau memperbarui target harian',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TargetRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Target berhasil diperbarui',
          },
          201: {
            description: 'Target berhasil dibuat',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
      get: {
        tags: ['Targets'],
        summary: 'Mengambil target harian user login',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Target berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          404: {
            description: 'Target belum dibuat',
          },
        },
      },
    },

    '/api/summary/today': {
      get: {
        tags: ['Summary'],
        summary: 'Mengambil ringkasan aktivitas hari ini',
        description:
          'Mengambil total aktivitas, total kalori, total durasi, total langkah, sedentary warning, target, dan progress harian.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Ringkasan aktivitas hari ini berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/reports/weekly': {
      get: {
        tags: ['Reports'],
        summary: 'Mengambil laporan aktivitas mingguan',
        description:
          'Menghitung total aktivitas, kalori, durasi, langkah, sedentary warning, aktivitas paling sering, rata-rata harian, dan laporan per hari selama 7 hari terakhir.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Laporan mingguan berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/recommendations/today': {
      get: {
        tags: ['Recommendations'],
        summary: 'Mengambil rekomendasi aktivitas hari ini',
        description:
          'Memberikan rekomendasi cerdas berdasarkan perbandingan antara aktivitas hari ini, target harian, progress kalori, progress durasi, progress langkah, dan sedentary warning.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Rekomendasi berhasil dibuat',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/achievements': {
      get: {
        tags: ['Achievements'],
        summary: 'Mengambil daftar achievement user',
        description:
          'Menghasilkan badge pencapaian berdasarkan total aktivitas, kalori, langkah, durasi, aktivitas jalan/lari, konsistensi hari aktif, dan kondisi sedentary warning.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Achievement berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
        },
      },
    },

    '/api/admin/summary': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard summary admin',
        description:
          'Mengambil ringkasan seluruh data sistem. Hanya dapat diakses oleh user dengan role admin.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Ringkasan admin berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          403: {
            description: 'Akses ditolak karena bukan admin',
          },
        },
      },
    },

    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Mengambil semua user',
        description: 'Menampilkan daftar seluruh user yang terdaftar di BurnTrack.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Daftar user berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          403: {
            description: 'Akses ditolak karena bukan admin',
          },
        },
      },
    },

    '/api/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Mengambil detail user berdasarkan ID',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Detail user berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          403: {
            description: 'Akses ditolak karena bukan admin',
          },
          404: {
            description: 'User tidak ditemukan',
          },
        },
      },
    },

    '/api/admin/users/{id}/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Mengambil statistik aktivitas user tertentu',
        description:
          'Mengambil total aktivitas, total kalori, total durasi, total langkah, sedentary warning, dan aktivitas favorit dari user tertentu.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Statistik user berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          403: {
            description: 'Akses ditolak karena bukan admin',
          },
          404: {
            description: 'User tidak ditemukan',
          },
        },
      },
    },

    '/api/admin/activities': {
      get: {
        tags: ['Admin'],
        summary: 'Mengambil semua aktivitas dari semua user',
        description:
          'Menampilkan seluruh aktivitas semua user, termasuk nama user, email, jenis aktivitas, durasi, kalori, langkah, warning, catatan, dan waktu aktivitas.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Semua aktivitas berhasil diambil',
          },
          401: {
            description: 'Token tidak valid',
          },
          403: {
            description: 'Akses ditolak karena bukan admin',
          },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
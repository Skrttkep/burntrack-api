const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BurnTrack API',
    version: '1.0.0',
    description:
      'Dokumentasi REST API BurnTrack untuk autentikasi, profile, aktivitas, target harian, summary, dan fitur admin.',
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
            example: 'Mario Admin',
          },
          email: {
            type: 'string',
            example: 'admin@burntrack.com',
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
            example: 'admin@burntrack.com',
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
        summary: 'Login user/admin',
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
        },
      },
    },

    '/api/activities': {
      post: {
        tags: ['Activities'],
        summary: 'Menambahkan aktivitas',
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
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Ringkasan berhasil diambil',
          },
        },
      },
    },

    '/api/admin/summary': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard summary admin',
        description: 'Hanya bisa diakses oleh user dengan role admin.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Ringkasan admin berhasil diambil',
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
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Daftar user berhasil diambil',
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
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Semua aktivitas berhasil diambil',
          },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
<template>
  <div class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="border-b border-gray-100 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 flex-shrink-0">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <span class="text-white font-bold text-sm">Q</span>
          </div>
          <span class="font-bold text-xl gradient-text">QuizZy</span>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden sm:flex items-center gap-2">
          <RouterLink to="/login" class="btn btn-ghost btn-md text-gray-600">Masuk</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-md">Daftar Gratis</RouterLink>
          <RouterLink to="/admin/login" class="btn btn-secondary btn-sm text-xs">Admin</RouterLink>
        </div>

        <!-- Mobile nav -->
        <div class="flex sm:hidden items-center gap-2">
          <RouterLink to="/login" class="btn btn-ghost btn-sm text-gray-600 px-3">Masuk</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm px-3">Daftar</RouterLink>
          <RouterLink to="/admin/login" class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">A</RouterLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 gradient-hero opacity-5 pointer-events-none" />
      <div class="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div class="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
          <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft"></span>
          Platform Quiz Kompetisi & Event Publik
        </div>
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-5 text-balance animate-slide-up leading-tight">
          Quiz yang
          <span class="gradient-text"> Adil, Seru,</span><br/>
          dan Terverifikasi
        </h1>
        <p class="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto text-balance animate-slide-up">
          Real-time leaderboard, anti-cheat canggih, dan hasil berQR verifikasi. Cocok untuk olimpiade, tryout, dan kompetisi kampus.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
          <RouterLink to="/register" class="btn btn-gradient btn-xl">Mulai Gratis</RouterLink>
          <RouterLink to="/login" class="btn btn-secondary btn-xl">Sudah Punya Akun</RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-6xl mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Semua yang kamu butuhkan</h2>
        <p class="text-gray-500">Fitur lengkap untuk penyelenggara dan peserta</p>
      </div>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        <div v-for="f in features" :key="f.title" class="card p-6 hover:shadow-card-hover transition-shadow">
          <div class="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-2xl" :class="f.bg">{{ f.icon }}</div>
          <h3 class="font-semibold text-gray-900 mb-2">{{ f.title }}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="gradient-hero py-14">
      <div class="max-w-4xl mx-auto px-4">
        <div class="grid grid-cols-3 gap-6 text-center text-white">
          <div><div class="text-2xl md:text-4xl font-bold mb-1">Real-time</div><div class="opacity-80 text-sm">Leaderboard</div></div>
          <div><div class="text-2xl md:text-4xl font-bold mb-1">Anti-Cheat</div><div class="opacity-80 text-sm">7 Layer</div></div>
          <div><div class="text-2xl md:text-4xl font-bold mb-1">QR</div><div class="opacity-80 text-sm">Verifikasi Hasil</div></div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
      <p>© 2025 QuizZy. Platform quiz kompetisi modern.</p>
    </footer>
  </div>
</template>

<script setup>
const features = [
  { icon: '⚡', title: 'Real-time Leaderboard', bg: 'bg-yellow-50', desc: 'Skor peserta update langsung saat mereka submit. Seru dan kompetitif!' },
  { icon: '🛡️', title: 'Anti-Cheat Canggih', bg: 'bg-red-50', desc: 'Fullscreen enforce, tab detection, rate limiting, dan enkripsi jawaban.' },
  { icon: '📊', title: 'Rekap & Analisis', bg: 'bg-blue-50', desc: 'Statistik lengkap per soal dan per peserta, bisa diexport ke Excel.' },
  { icon: '🎯', title: 'Hybrid Mode', bg: 'bg-green-50', desc: 'Host-controlled (Kahoot-style) atau free-start. Admin yang pilih.' },
  { icon: '📄', title: 'Hasil Terverifikasi', bg: 'bg-purple-50', desc: 'Peserta download hasil PDF/JPG dengan QR code yang bisa diverifikasi.' },
  { icon: '📋', title: 'Import Soal Excel', bg: 'bg-indigo-50', desc: 'Upload ratusan soal sekaligus dari file Excel dengan template yang mudah.' },
]
</script>

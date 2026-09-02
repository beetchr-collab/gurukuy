export type SelectOption = {
  label: string;
  value: string;
};

export const METODE_PEMBELAJARAN_OPTIONS: SelectOption[] = [
  // Metode Pembelajaran Umum
  { label: "Ceramah", value: "Ceramah" },
  { label: "Diskusi", value: "Diskusi" },
  { label: "Tanya Jawab", value: "Tanya Jawab" },
  { label: "Demonstrasi", value: "Demonstrasi" },
  { label: "Praktik", value: "Praktik" },
  { label: "Eksperimen", value: "Eksperimen" },
  { label: "Simulasi", value: "Simulasi" },
  { label: "Penugasan", value: "Penugasan" },
  { label: "Latihan (Drill)", value: "Latihan (Drill)" },
  { label: "Resitasi", value: "Resitasi" },
  { label: "Tutorial", value: "Tutorial" },
  { label: "Studi Kasus", value: "Studi Kasus" },
  { label: "Sosiodrama", value: "Sosiodrama" },
  { label: "Role Playing", value: "Role Playing" },
  { label: "Karyawisata", value: "Karyawisata" },
  { label: "Observasi", value: "Observasi" },

  // Model Pembelajaran Berbasis Masalah dan Proyek
  {    label: "Problem Based Learning (PBL)",    value: "Problem Based Learning (PBL)",  },
  {    label: "Project Based Learning (PjBL)",    value: "Project Based Learning (PjBL)",  },
  {    label: "Problem Solving",    value: "Problem Solving",  },
  {    label: "Inquiry Based Learning",    value: "Inquiry Based Learning",  },
  {    label: "Discovery Learning",    value: "Discovery Learning",  },
  {    label: "Contextual Teaching and Learning (CTL)",    value: "Contextual Teaching and Learning (CTL)",  },

  // Pembelajaran Kooperatif
  {    label: "Cooperative Learning",    value: "Cooperative Learning",  },
  {    label: "Jigsaw",    value: "Jigsaw",  },
  {    label: "Think Pair Share (TPS)",    value: "Think Pair Share (TPS)",  },
  {    label: "Student Teams Achievement Division (STAD)",    value: "Student Teams Achievement Division (STAD)",  },
  {    label: "Team Games Tournament (TGT)",    value: "Team Games Tournament (TGT)",  },
  {    label: "Numbered Heads Together (NHT)",    value: "Numbered Heads Together (NHT)",  },
  {    label: "Make a Match",    value: "Make a Match",  },
  {    label: "Group Investigation",    value: "Group Investigation",  },

  // Pembelajaran Aktif
  {    label: "Active Learning",    value: "Active Learning",  },
  {    label: "Experiential Learning",    value: "Experiential Learning",  },
  {    label: "Learning by Doing",    value: "Learning by Doing",  },
  {    label: "Peer Teaching",    value: "Peer Teaching",  },
  {    label: "Peer Tutoring",    value: "Peer Tutoring",  },
  {    label: "Collaborative Learning",    value: "Collaborative Learning",  },
  {    label: "Blended Learning",    value: "Blended Learning",  },
  {    label: "Flipped Classroom",    value: "Flipped Classroom",  },

  // Pembelajaran Berbasis Teknologi
  {    label: "E-Learning",    value: "E-Learning",  },
  {    label: "Pembelajaran Daring",    value: "Pembelajaran Daring",  },
  {    label: "Pembelajaran Luring",    value: "Pembelajaran Luring",  },
  {    label: "Hybrid Learning",    value: "Hybrid Learning",  },
  {    label: "Game Based Learning",    value: "Game Based Learning",  },
  {    label: "Digital Learning",    value: "Digital Learning",  },

  // Pendekatan Berbasis Literasi dan Kreativitas
  {    label: "Brainstorming",    value: "Brainstorming",  },
  {    label: "Mind Mapping",    value: "Mind Mapping",  },
  {    label: "Concept Mapping",    value: "Concept Mapping",  },
  {    label: "Creative Problem Solving",    value: "Creative Problem Solving",  },
  {    label: "Debat",   value: "Debat",  },
  {    label: "Presentasi",    value: "Presentasi",  },

  // Lainnya
  {    label: "Lainnya",    value: "Lainnya",  },
];

export const MEDIA_PEMBELAJARAN_OPTIONS: SelectOption[] = [
  { label: "Buku", value: "Buku" },
  { label: "Modul", value: "Modul" },
  { label: "PPT", value: "PPT" },
  { label: "Video", value: "Video" },
  { label: "LKPD", value: "LKPD" },
  { label: "Internet", value: "Internet" },
  { label: "Laboratorium", value: "Laboratorium" },
  { label: "Proyektor", value: "Proyektor" },
  { label: "Komputer", value: "Komputer" },
  { label: "Laptop", value: "Laptop" },
  { label: "Tablet", value: "Tablet" },
  { label: "Smartphone", value: "Smartphone" },
  { label: "Audio", value: "Audio" },
  { label: "E-Book", value: "E-Book" },
  { label: "Google Classroom", value: "Google Classroom" },
  { label: "Video Conference", value: "Video Conference" },
  { label: "Papan Tulis", value: "Papan Tulis" },
  { label: "Whiteboard", value: "Whiteboard" },
  { label: "Alat Peraga", value: "Alat Peraga" },
  { label: "Lingkungan Sekitar", value: "Lingkungan Sekitar" },
  { label: "Lainnya", value: "Lainnya" },
];

export const REFLEKSI_PEMBELAJARAN_OPTIONS: SelectOption[] = [
  {
    label:
      "Pembelajaran berjalan dengan baik dan sebagian besar siswa mampu memahami materi yang disampaikan.",
    value:
      "Pembelajaran berjalan dengan baik dan sebagian besar siswa mampu memahami materi yang disampaikan.",
  },
  {
    label:
      "Siswa terlihat aktif mengikuti pembelajaran dan mampu berpartisipasi dalam kegiatan diskusi dengan baik.",
    value:
      "Siswa terlihat aktif mengikuti pembelajaran dan mampu berpartisipasi dalam kegiatan diskusi dengan baik.",
  },
  {
    label:
      "Sebagian besar siswa telah mencapai tujuan pembelajaran, namun beberapa siswa masih memerlukan bimbingan lebih lanjut.",
    value:
      "Sebagian besar siswa telah mencapai tujuan pembelajaran, namun beberapa siswa masih memerlukan bimbingan lebih lanjut.",
  },
  {
    label:
      "Siswa cukup antusias mengikuti pembelajaran, terutama saat kegiatan praktik dan diskusi kelompok.",
    value:
      "Siswa cukup antusias mengikuti pembelajaran, terutama saat kegiatan praktik dan diskusi kelompok.",
  },
  {
    label:
      "Pembelajaran berlangsung kondusif. Siswa mampu mengikuti instruksi dan menyelesaikan tugas sesuai waktu yang diberikan.",
    value:
      "Pembelajaran berlangsung kondusif. Siswa mampu mengikuti instruksi dan menyelesaikan tugas sesuai waktu yang diberikan.",
  },
  {
    label:
      "Beberapa siswa masih mengalami kesulitan memahami materi sehingga diperlukan penguatan pada pertemuan berikutnya.",
    value:
      "Beberapa siswa masih mengalami kesulitan memahami materi sehingga diperlukan penguatan pada pertemuan berikutnya.",
  },
  {
    label:
      "Kegiatan pembelajaran berjalan sesuai dengan rencana. Materi dapat disampaikan sesuai alokasi waktu yang tersedia.",
    value:
      "Kegiatan pembelajaran berjalan sesuai dengan rencana. Materi dapat disampaikan sesuai alokasi waktu yang tersedia.",
  },
  {
    label:
      "Siswa menunjukkan pemahaman yang cukup baik melalui hasil diskusi dan latihan yang diberikan.",
    value:
      "Siswa menunjukkan pemahaman yang cukup baik melalui hasil diskusi dan latihan yang diberikan.",
  },
  {
    label:
      "Diskusi kelompok berjalan aktif, meskipun masih terdapat beberapa siswa yang kurang berpartisipasi.",
    value:
      "Diskusi kelompok berjalan aktif, meskipun masih terdapat beberapa siswa yang kurang berpartisipasi.",
  },
  {
    label:
      "Siswa mampu bekerja sama dalam kelompok dan menunjukkan sikap saling membantu selama kegiatan pembelajaran.",
    value:
      "Siswa mampu bekerja sama dalam kelompok dan menunjukkan sikap saling membantu selama kegiatan pembelajaran.",
  },
  {
    label:
      "Sebagian siswa masih kurang fokus selama pembelajaran sehingga diperlukan pengelolaan kelas yang lebih baik.",
    value:
      "Sebagian siswa masih kurang fokus selama pembelajaran sehingga diperlukan pengelolaan kelas yang lebih baik.",
  },
  {
    label:
      "Materi dapat dipahami dengan baik setelah diberikan contoh dan latihan secara bertahap.",
    value:
      "Materi dapat dipahami dengan baik setelah diberikan contoh dan latihan secara bertahap.",
  },
  {
    label:
      "Kegiatan praktik berjalan dengan baik. Siswa mampu mengikuti langkah-langkah yang telah diberikan.",
    value:
      "Kegiatan praktik berjalan dengan baik. Siswa mampu mengikuti langkah-langkah yang telah diberikan.",
  },
  {
    label:
      "Waktu pembelajaran belum sepenuhnya mencukupi untuk menyelesaikan seluruh kegiatan, sehingga beberapa aktivitas dilanjutkan pada pertemuan berikutnya.",
    value:
      "Waktu pembelajaran belum sepenuhnya mencukupi untuk menyelesaikan seluruh kegiatan, sehingga beberapa aktivitas dilanjutkan pada pertemuan berikutnya.",
  },
  {
    label:
      "Siswa menunjukkan peningkatan pemahaman setelah dilakukan tanya jawab dan pembahasan bersama.",
    value:
      "Siswa menunjukkan peningkatan pemahaman setelah dilakukan tanya jawab dan pembahasan bersama.",
  },
  {
    label:
      "Beberapa siswa masih pasif dalam kegiatan pembelajaran dan perlu diberikan kesempatan lebih banyak untuk menyampaikan pendapat.",
    value:
      "Beberapa siswa masih pasif dalam kegiatan pembelajaran dan perlu diberikan kesempatan lebih banyak untuk menyampaikan pendapat.",
  },
  {
    label:
      "Tujuan pembelajaran tercapai dengan baik. Siswa mampu menyelesaikan tugas sesuai dengan kompetensi yang diharapkan.",
    value:
      "Tujuan pembelajaran tercapai dengan baik. Siswa mampu menyelesaikan tugas sesuai dengan kompetensi yang diharapkan.",
  },
  {
    label:
      "Pembelajaran berlangsung cukup baik, tetapi perlu peningkatan dalam pengaturan waktu pada kegiatan diskusi.",
    value:
      "Pembelajaran berlangsung cukup baik, tetapi perlu peningkatan dalam pengaturan waktu pada kegiatan diskusi.",
  },
  {
    label:
      "Siswa terlihat antusias menggunakan media pembelajaran yang diberikan dan lebih mudah memahami materi melalui contoh visual.",
    value:
      "Siswa terlihat antusias menggunakan media pembelajaran yang diberikan dan lebih mudah memahami materi melalui contoh visual.",
  },
  {
    label:
      "Hasil evaluasi menunjukkan bahwa sebagian besar siswa telah memahami materi, sementara beberapa siswa memerlukan remedial.",
    value:
      "Hasil evaluasi menunjukkan bahwa sebagian besar siswa telah memahami materi, sementara beberapa siswa memerlukan remedial.",
  },
  {
    label:
      "Pembelajaran berjalan kondusif dan interaksi antara guru dan siswa berlangsung dengan baik.",
    value:
      "Pembelajaran berjalan kondusif dan interaksi antara guru dan siswa berlangsung dengan baik.",
  },
  {
    label:
      "Siswa mampu menghubungkan materi yang dipelajari dengan contoh dalam kehidupan sehari-hari.",
    value:
      "Siswa mampu menghubungkan materi yang dipelajari dengan contoh dalam kehidupan sehari-hari.",
  },
  {
    label:
      "Kegiatan pembelajaran perlu ditingkatkan dengan memberikan lebih banyak contoh dan latihan agar pemahaman siswa lebih merata.",
    value:
      "Kegiatan pembelajaran perlu ditingkatkan dengan memberikan lebih banyak contoh dan latihan agar pemahaman siswa lebih merata.",
  },
  {
    label:
      "Siswa cukup aktif selama pembelajaran, namun masih terdapat beberapa siswa yang perlu diarahkan agar lebih fokus pada kegiatan.",
    value:
      "Siswa cukup aktif selama pembelajaran, namun masih terdapat beberapa siswa yang perlu diarahkan agar lebih fokus pada kegiatan.",
  },
  {
    label:
      "Metode pembelajaran yang digunakan cukup efektif dalam meningkatkan keterlibatan siswa selama proses pembelajaran.",
    value:
      "Metode pembelajaran yang digunakan cukup efektif dalam meningkatkan keterlibatan siswa selama proses pembelajaran.",
  },
  {
    label:
      "Pembelajaran hari ini berjalan sesuai rencana. Siswa mampu mengikuti seluruh tahapan kegiatan dengan baik.",
    value:
      "Pembelajaran hari ini berjalan sesuai rencana. Siswa mampu mengikuti seluruh tahapan kegiatan dengan baik.",
  },
  {
    label:
      "Beberapa siswa mengalami kesulitan pada bagian tertentu dari materi sehingga akan diberikan penjelasan dan latihan tambahan.",
    value:
      "Beberapa siswa mengalami kesulitan pada bagian tertentu dari materi sehingga akan diberikan penjelasan dan latihan tambahan.",
  },
  {
    label:
      "Kegiatan refleksi menunjukkan bahwa siswa telah memahami konsep utama materi, tetapi masih perlu penguatan pada penerapannya.",
    value:
      "Kegiatan refleksi menunjukkan bahwa siswa telah memahami konsep utama materi, tetapi masih perlu penguatan pada penerapannya.",
  },
  {
    label:
      "Pembelajaran berlangsung efektif dan siswa mampu menyelesaikan tugas individu maupun kelompok sesuai dengan waktu yang ditentukan.",
    value:
      "Pembelajaran berlangsung efektif dan siswa mampu menyelesaikan tugas individu maupun kelompok sesuai dengan waktu yang ditentukan.",
  },
  {
    label:
      "Materi belum sepenuhnya dikuasai oleh seluruh siswa. Pada pertemuan berikutnya akan dilakukan pengulangan dan penguatan terhadap materi yang belum dipahami.",
    value:
      "Materi belum sepenuhnya dikuasai oleh seluruh siswa. Pada pertemuan berikutnya akan dilakukan pengulangan dan penguatan terhadap materi yang belum dipahami.",
  },
  { label: "Lainnya", value: "Lainnya" },
];

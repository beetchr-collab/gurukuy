export interface JenisPenilaian {
    idPenilaian: string;
    namaPenilaian: string;
    kategoriPenilaian: string;
}

export const JENIS_PENILAIAN: JenisPenilaian[] = [
    {
        idPenilaian: "asesmen-diagnostik",
        namaPenilaian: "Asesmen Diagnostik",
        kategoriPenilaian: "Diagnostik",
    },
    {
        idPenilaian: "asesmen-formatif",
        namaPenilaian: "Asesmen Formatif",
        kategoriPenilaian: "Formatif",
    },
    {
        idPenilaian: "asesmen-sumatif",
        namaPenilaian: "Asesmen Sumatif",
        kategoriPenilaian: "Sumatif",
    },
    {
        idPenilaian: "asesmen-sumatif-tengah-semester",
        namaPenilaian: "Asesmen Sumatif Tengah Semester",
        kategoriPenilaian: "Sumatif",
    },
    {
        idPenilaian: "asesmen-sumatif-akhir-semester",
        namaPenilaian: "Asesmen Sumatif Akhir Semester",
        kategoriPenilaian: "Sumatif",
    },
    {
        idPenilaian: "asesmen-sumatif-akhir-jenjang",
        namaPenilaian: "Asesmen Sumatif Akhir Jenjang",
        kategoriPenilaian: "Sumatif",
    },
];

/**
 * Mengambil seluruh jenis penilaian
 */
export const getAllJenisPenilaian = () => JENIS_PENILAIAN;

/**
 * Mengambil jenis penilaian berdasarkan kategori
 */
export const getJenisPenilaianByKategori = (kategoriPenilaian: string) =>
    JENIS_PENILAIAN.filter(
        (item) => item.kategoriPenilaian.toLowerCase() === kategoriPenilaian.toLowerCase()
    );

/**
 * Mengambil detail jenis penilaian berdasarkan id
 */
export const getJenisPenilaianById = (idPenilaian: string) =>
    JENIS_PENILAIAN.find((item) => item.idPenilaian === idPenilaian);
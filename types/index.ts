export type Role ="superadmin" | "admin" | "guru";

export interface UserData {
  uid: string;
  name?: string;
  email: string;
  role?: Role;
  schoolId?: string;
}

export interface School {
  id?: string;
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kodeSekolah: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
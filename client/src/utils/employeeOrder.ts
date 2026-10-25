// Urutan Pegawai Baku sesuai permintaan USER.
// Dipakai bersama halaman Honor dan Rekap agar urutan daftar pegawai
// di kedua halaman selalu sama. Pegawai yang tidak ada di daftar
// (mis. pegawai baru) diletakkan di akhir, diurutkan alfabetis.

export const FIXED_ORDER: number[] = [
  422, 10869, 10878, 10871, 377, 378, 10881, 10870, 12582, 10875, 10873, 10872, 12060,
  12058, 12064, 12057, 12059, 12061, 12451, 12644, 12642, 12645, 12647, 12651, 202207,
  202208, 12759, 12764, 12763, 12762, 202203, 202212, 202213, 202218, 202222, 202221,
  202202, 202205, 202214, 202211, 202220, 202210, 202216, 202209, 202217, 202219
];

export function compareEmployeeOrder(
  a: { employeeId: number | string; employeeName: string },
  b: { employeeId: number | string; employeeName: string }
): number {
  const posA = FIXED_ORDER.indexOf(Number(a.employeeId));
  const posB = FIXED_ORDER.indexOf(Number(b.employeeId));
  const finalPosA = posA === -1 ? 9999 : posA;
  const finalPosB = posB === -1 ? 9999 : posB;
  if (finalPosA !== finalPosB) return finalPosA - finalPosB;
  return a.employeeName.localeCompare(b.employeeName);
}

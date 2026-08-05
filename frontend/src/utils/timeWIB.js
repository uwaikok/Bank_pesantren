/**
 * Utility: Format timestamp ke zona waktu WIB (Asia/Jakarta, UTC+7)
 *
 * PostgreSQL (Neon/Vercel) menyimpan timestamp dalam UTC.
 * JavaScript new Date() juga menginterpretasikan string tanpa timezone sebagai UTC.
 * Semua fungsi di sini memaksa output ke WIB sehingga jam yang tampil selalu tepat.
 */

const WIB_LOCALE = 'id-ID';
const WIB_TZ    = 'Asia/Jakarta';

/**
 * Ubah nilai timestamp (string ISO, Date, atau number) menjadi objek Date
 * yang sudah disesuaikan dengan WIB.
 * Catatan: objek Date tetap menyimpan nilai UTC di dalamnya,
 * pemformatan WIB dilakukan via Intl.DateTimeFormat dengan timeZone: 'Asia/Jakarta'.
 */
function toDate(ts) {
  if (!ts) return new Date();
  // Postgres sering mengembalikan string seperti "2026-08-05T12:30:00.000Z" (UTC)
  // atau "2026-08-05 19:30:00" (tanpa info timezone → ditafsirkan UTC oleh Date)
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format: "05 Agu 2026  •  19:30 WIB"
 */
export function formatDateTimeWIB(ts) {
  const d = toDate(ts);
  const tanggal = new Intl.DateTimeFormat(WIB_LOCALE, {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: WIB_TZ
  }).format(d);
  const jam = new Intl.DateTimeFormat(WIB_LOCALE, {
    hour: '2-digit', minute: '2-digit',
    hour12: false,
    timeZone: WIB_TZ
  }).format(d);
  return `${tanggal}  •  ${jam} WIB`;
}

/**
 * Format tanggal saja: "05 Agu 2026"
 */
export function formatDateWIB(ts) {
  const d = toDate(ts);
  return new Intl.DateTimeFormat(WIB_LOCALE, {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: WIB_TZ
  }).format(d);
}

/**
 * Format jam saja: "19:30 WIB"
 */
export function formatTimeWIB(ts) {
  const d = toDate(ts);
  const jam = new Intl.DateTimeFormat(WIB_LOCALE, {
    hour: '2-digit', minute: '2-digit',
    hour12: false,
    timeZone: WIB_TZ
  }).format(d);
  return `${jam} WIB`;
}

/**
 * Format untuk struk Kasir: "05/08/2026, 19.30"
 */
export function formatReceiptWIB(ts) {
  const d = toDate(ts);
  return new Intl.DateTimeFormat(WIB_LOCALE, {
    dateStyle: 'short', timeStyle: 'short',
    timeZone: WIB_TZ
  }).format(d);
}

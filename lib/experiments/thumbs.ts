// Ảnh xem nhanh cho thí nghiệm có bản web (chưa có thumbnail_url trong cơ sở dữ liệu).
// Dùng chung cho phòng thí nghiệm ảo của học sinh và trang thí nghiệm của giáo viên.
const EXPERIMENT_THUMBS: Record<string, string> = {
  '/experiments/vat-dan-dien-cach-dien/index.html': '/experiments/thumbs/vat-dan-dien-cach-dien.jpg',
  '/experiments/mach-dien-don-gian/index.html': '/experiments/thumbs/mach-dien-don-gian.jpg',
};

export function experimentThumb(exp: { thumbnail_url: string | null; embed_url: string | null }): string | null {
  return exp.thumbnail_url ?? (exp.embed_url ? EXPERIMENT_THUMBS[exp.embed_url] : undefined) ?? null;
}

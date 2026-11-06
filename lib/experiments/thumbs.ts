// Ảnh xem nhanh cho thí nghiệm có bản web (chưa có thumbnail_url trong cơ sở dữ liệu).
// Dùng chung cho phòng thí nghiệm ảo của học sinh và trang thí nghiệm của giáo viên.
const EXPERIMENT_THUMBS: Record<string, string> = {
  '/experiments/vat-dan-dien-cach-dien/index.html': '/experiments/thumbs/vat-dan-dien-cach-dien.jpg',
  '/experiments/mach-dien-don-gian/index.html': '/experiments/thumbs/mach-dien-don-gian.jpg',
  '/experiments/lo-xo-dan-hoi/index.html': '/experiments/thumbs/lo-xo-dan-hoi.jpg',
};

export function experimentThumb(exp: { thumbnail_url: string | null; embed_url: string | null }): string | null {
  return exp.thumbnail_url ?? (exp.embed_url ? EXPERIMENT_THUMBS[exp.embed_url] : undefined) ?? null;
}

// Ảnh xem nhanh cho mô phỏng 3D (dự phòng khi cơ sở dữ liệu chưa có thumbnail_url).
const MODEL_THUMBS: Record<string, string> = {
  '/models-3d/te-bao-nhan-so/index.html': '/models-3d/thumbs/te-bao-nhan-so.jpg',
  '/models-3d/te-bao-nhan-thuc/index.html': '/models-3d/thumbs/te-bao-nhan-thuc-3d.jpg',
};

export function modelThumb(m: { thumbnail_url: string | null; embed_url: string | null }): string | null {
  return m.thumbnail_url ?? (m.embed_url ? MODEL_THUMBS[m.embed_url] : undefined) ?? null;
}

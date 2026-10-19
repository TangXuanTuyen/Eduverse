import { redirect } from 'next/navigation';

// Chưa có đăng nhập: tạm chuyển thẳng vào khu học sinh. Bước Auth sẽ điều hướng theo vai trò.
export default function Home() {
  redirect('/student');
}

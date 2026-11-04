import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Đưa lớp phủ ra thẳng <body>. Cần thiết vì trang được bọc trong khung chuyển cảnh có transform:
 * phần tử `position: fixed` bên trong sẽ bị căn theo khung đó (cả trang dài) thay vì theo cửa sổ.
 */
export default function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

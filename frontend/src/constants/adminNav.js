import {
  Backpack,
  CalendarDays,
  ChartNoAxesCombined,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Tent,
} from "lucide-react";

export const adminNav = [
  ["/admin", "Ringkasan", ChartNoAxesCombined],
  ["/admin/pos", "Kasir Cepat (POS)", ShoppingCart],
  ["/admin/reservasi", "Reservasi", CalendarDays],
  ["/admin/pesanan", "Pesanan", Package],
  ["/admin/disewa", "Daftar Penyewaan", Backpack],
  ["/admin/inventaris", "Katalog & Stok", Tent],
  ["/admin/nota", "Nota Digital", ReceiptText],
  ["/admin/analisis", "Analisis Bisnis", ChartNoAxesCombined],
  ["/admin/pengaturan", "Pengaturan", Settings],
];
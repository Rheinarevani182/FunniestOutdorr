export async function productPhoto(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Pilih foto JPG, PNG, atau WebP.");
  if (file.size > 20000000) throw Error("Ukuran foto maksimal 20 MB.");
  const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    }),
    scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * scale);
  c.height = Math.round(bitmap.height * scale);
  c.getContext("2d").drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close();
  let uri = c.toDataURL("image/jpeg", 0.72);
  if (uri.length > 400000) uri = c.toDataURL("image/jpeg", 0.4);
  if (uri.length > 400000)
    throw Error("Foto masih terlalu besar, pilih gambar yang lebih sederhana.");
  return uri;
}
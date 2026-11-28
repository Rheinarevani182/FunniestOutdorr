export function csv(name, rows) {
  const blob = new Blob(
      [
        "\ufeff" +
          rows
            .map((r) =>
              r
                .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
                .join(","),
            )
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    ),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
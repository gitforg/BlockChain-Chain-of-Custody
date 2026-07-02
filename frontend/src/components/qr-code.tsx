type QrCodeProps = {
  value: string;
  label: string;
};

function buildMatrix(value: string, size = 21) {
  let seed = 0;

  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  }

  const matrix = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const mix = (seed + row * 17 + col * 31 + row * col * 13) >>> 0;
      const mirrored = row < 7 || col < 7 || row > size - 8 || col > size - 8;
      return mirrored || mix % 3 === 0;
    }),
  );

  return matrix;
}

export function QrCode({ value, label }: QrCodeProps) {
  const matrix = buildMatrix(value);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">QR Code</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
          Hash anchored
        </div>
      </div>
      <div
        className="mt-4 grid gap-1 rounded-[1.25rem] bg-white p-4 shadow-inner shadow-slate-950/20"
        style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
        aria-label={`QR code for ${value}`}
      >
        {matrix.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <span
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square rounded-[2px] ${cell ? "bg-slate-950" : "bg-white"}`}
            />
          )),
        )}
      </div>
      <p className="mt-4 break-all rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}
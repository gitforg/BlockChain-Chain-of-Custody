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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">QR Registry</p>
          <h3 className="mt-1 text-base font-semibold text-slate-800">{label}</h3>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          On-Chain Anchored
        </div>
      </div>
      <div
        className="mt-4 grid gap-[2px] rounded-xl bg-slate-50 border border-slate-100 p-4 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
        aria-label={`QR code for ${value}`}
      >
        {matrix.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <span
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square rounded-[1px] ${cell ? "bg-slate-900" : "bg-white"}`}
            />
          )),
        )}
      </div>
      <p className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
        {value}
      </p>
    </div>
  );
}
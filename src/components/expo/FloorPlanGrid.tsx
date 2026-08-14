import { MapPin } from "lucide-react";

export type Booth = {
  id: string;
  booth_number: string;
  size: "standard" | "double" | "premium";
  price: number;
  status: "available" | "reserved" | "booked";
};

type FloorPlanGridProps = {
  booths: Booth[];
  onBoothClick?: (booth: Booth) => void;
  selectedBoothNumber?: string | null;
};

export function FloorPlanGrid({ booths, onBoothClick, selectedBoothNumber }: FloorPlanGridProps) {
  const getBooth = (num: number) => booths.find((b) => b.booth_number === num.toString());

  const renderBooth = (num: number) => {
    const booth = getBooth(num);
    if (!booth)
      return (
        <div className="w-12 h-12 bg-secondary/20 rounded-md border border-border border-dashed" />
      );

    const isAvailable = booth.status === "available";
    const isReserved = booth.status === "reserved";
    const isBooked = booth.status === "booked";
    const isSelected = selectedBoothNumber === booth.booth_number;

    let bgClass = "bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20";
    if (isReserved) bgClass = "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed";
    if (isBooked) bgClass = "bg-red-500/10 text-red-700 border-red-500/30 cursor-not-allowed";
    if (isSelected)
      bgClass =
        "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2";

    const baseClass =
      "flex flex-col items-center justify-center rounded-md border p-1 text-xs font-bold transition-all " +
      bgClass;

    // Adjust width based on tier (just for visual distinction)
    const sizeClass =
      booth.size === "premium"
        ? "w-16 h-16 sm:w-20 sm:h-20"
        : booth.size === "double"
          ? "w-14 h-14 sm:w-16 sm:h-16"
          : "w-12 h-12 sm:w-14 sm:h-14";

    return (
      <button
        key={num}
        disabled={!isAvailable && !isSelected}
        onClick={() => {
          if (isAvailable && onBoothClick) onBoothClick(booth);
        }}
        className={`${baseClass} ${sizeClass}`}
        title={`Booth ${booth.booth_number} - KES ${booth.price.toLocaleString()}`}
      >
        <span className="text-[10px] opacity-70 mb-0.5">
          {booth.size === "premium" ? "PR" : booth.size === "double" ? "DB" : "ST"}
        </span>
        {booth.booth_number}
      </button>
    );
  };

  const renderRow = (start: number, end: number) => {
    const arr = [];
    // If start < end, ascending
    if (start <= end) {
      for (let i = start; i <= end; i++) arr.push(renderBooth(i));
    } else {
      for (let i = start; i >= end; i--) arr.push(renderBooth(i));
    }
    return arr;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-card rounded-2xl border border-border/60 shadow-inner p-6 sm:p-10 overflow-x-auto">
      <div className="min-w-[800px] flex flex-col gap-12 items-center">
        {/* Top Room label */}
        <div className="w-full flex justify-between items-center px-10 text-muted-foreground font-semibold uppercase tracking-widest text-sm">
          <div className="border border-border/50 bg-secondary/30 px-6 py-2 rounded-xl">
            Fire Exit
          </div>
          <div className="border border-border/50 bg-secondary/30 px-6 py-2 rounded-xl flex items-center gap-2">
            <MapPin size={16} /> Meeting Room A
          </div>
        </div>

        {/* Top Row: 52-61 */}
        <div className="flex gap-2 p-4 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
          {renderRow(52, 61)}
        </div>

        {/* Middle Blocks */}
        <div className="flex w-full justify-center gap-16">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">{renderRow(44, 47)}</div>
            <div className="grid grid-cols-4 gap-2">{renderRow(48, 51)}</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">{renderRow(36, 39)}</div>
            <div className="grid grid-cols-4 gap-2">{renderRow(40, 43)}</div>
          </div>
        </div>

        <div className="flex w-full justify-center gap-16">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">{renderRow(28, 31)}</div>
            <div className="grid grid-cols-4 gap-2">{renderRow(32, 35)}</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">{renderRow(20, 23)}</div>
            <div className="grid grid-cols-4 gap-2">{renderRow(24, 27)}</div>
          </div>
        </div>

        {/* Small cluster 14-19 */}
        <div className="flex gap-4">
          <div className="grid grid-cols-3 gap-2 p-4 bg-secondary/20 rounded-xl border border-border/50">
            {renderRow(14, 16)}
            {renderRow(17, 19)}
          </div>
        </div>

        {/* Bottom Row: 1-13 */}
        <div className="flex gap-2 p-4 border-2 border-dashed border-border/60 rounded-2xl bg-secondary/10">
          {renderRow(1, 13)}
        </div>

        {/* Bottom Entrance */}
        <div className="w-full flex justify-center mt-4">
          <div className="text-xl font-display font-bold uppercase tracking-widest text-primary border-b-4 border-primary px-12 pb-2">
            Main Entrance
          </div>
        </div>
      </div>
    </div>
  );
}

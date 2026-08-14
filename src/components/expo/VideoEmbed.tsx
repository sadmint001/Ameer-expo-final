interface VideoEmbedProps {
  youtubeId?: string;
  src?: string;
  caption?: string;
  autoPlay?: boolean;
}

export function VideoEmbed({ youtubeId, src, caption, autoPlay }: VideoEmbedProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-soft pt-[56.25%] bg-black">
        {youtubeId ? (
          <iframe
            className="absolute top-0 left-0 h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1${autoPlay ? "&autoplay=1&mute=1" : ""}`}
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : src ? (
          <video
            className="absolute top-0 left-0 h-full w-full object-cover"
            src={src}
            controls={!autoPlay}
            preload="metadata"
            autoPlay={autoPlay}
            muted={autoPlay}
            loop={autoPlay}
          />
        ) : (
          <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center text-muted-foreground bg-secondary/30">
            No video provided
          </div>
        )}
      </div>
      {caption && <p className="text-sm text-center text-muted-foreground">{caption}</p>}
    </div>
  );
}

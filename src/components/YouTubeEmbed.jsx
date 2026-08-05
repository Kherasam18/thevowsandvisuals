/**
 * 16:9 YouTube player.
 *
 * Uses youtube-nocookie.com — functionally identical to the source's embed
 * but without the extra tracking cookies, in keeping with stripping the
 * original site's analytics. The recordings show click-to-play (no autoplay),
 * which is the default behaviour here.
 */
export default function YouTubeEmbed({ id, title, className = '' }) {
  return (
    <div className={`aspect-video w-full overflow-hidden bg-black ${className}`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}

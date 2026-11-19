
interface IframeChartProps {
  width: number;
  height: number;
  url: string;
}

export default function IframeChart({
  width,
  height,
  url,
}: IframeChartProps) {
  if (!url) {
    return <div>Please configure an iframe URL.</div>;
  }

  let safeUrl: string;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return <div>Only HTTPS URLs are supported.</div>;
    }
    safeUrl = parsed.href;
  } catch {
    return <div>Invalid iframe URL.</div>;
  }

  return (
    <iframe
      src={safeUrl}
      title="External Website"
      width={width}
      height={height}
      style={{
        border: 'none',
        display: 'block',
        width: '100%',
        height: '100%',
      }}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
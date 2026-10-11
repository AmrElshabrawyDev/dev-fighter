import type { PublicChallenge } from "@/data/challenges";

type Props = {
  challenge: Pick<PublicChallenge, "target" | "width" | "height">;
  /** shown width in CSS pixels; height follows the challenge's aspect ratio */
  size: number;
  label: string;
};

/** A challenge's target image (rendered from its reference by `npm run targets`) */
export function TargetImage({ challenge, size, label }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- exact pixels, never re-encoded by the optimizer
    <img
      src={challenge.target}
      alt={label}
      width={size}
      height={Math.round((challenge.height * size) / challenge.width)}
      className="shrink-0 rounded-lg border border-border-default"
    />
  );
}

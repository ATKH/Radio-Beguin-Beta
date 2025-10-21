import clsx from "clsx";

const BLOBS = [
  { id: "sunset", intensity: "strong" },
  { id: "aurora", intensity: "medium" },
  { id: "sherbet", intensity: "soft" },
  { id: "violet", intensity: "soft" },
];

export default function AnimatedBackdrop() {
  return (
    <div className="animated-backdrop" aria-hidden="true">
      {BLOBS.map(({ id, intensity }) => (
        <span key={id} className={clsx("animated-backdrop__blob", `blob--${id}`, `blob--${intensity}`)} />
      ))}
    </div>
  );
}

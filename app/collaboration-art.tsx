import { MotionFigure } from "./motion-figure";

export function TogetherArt() {
  return (
    <MotionFigure
      variant="together"
      caption="Eigene Perspektiven. Gemeinsame Möglichkeiten."
    >
      <svg viewBox="0 0 520 440" fill="none">
        <path
          className="art-guide"
          d="M25 220h470M260 15v375"
          stroke="currentColor"
          strokeDasharray="2 7"
        />
        <g className="perspective perspective-one">
          <circle cx="200" cy="203" r="122" />
          <circle cx="200" cy="81" r="4" className="art-point" />
        </g>
        <g className="perspective perspective-two">
          <circle cx="320" cy="203" r="122" />
          <circle cx="425.7" cy="264" r="4" className="art-point" />
        </g>
        <g className="perspective perspective-three">
          <circle cx="260" cy="288" r="122" />
          <circle cx="154.3" cy="349" r="4" className="art-point" />
        </g>
        <g className="shared-spark">
          <path
            d="M260 215v48m-24-24h48m-41-17 34 34m-34 0 34-34"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="260"
            cy="239"
            r="35"
            stroke="currentColor"
            strokeOpacity=".3"
          />
        </g>
        <text x="50" y="47" className="art-label">
          Erfahrung.
        </text>
        <text x="387" y="47" className="art-label">
          Neugier.
        </text>
        <text x="260" y="435" textAnchor="middle" className="art-label">
          Ideen.
        </text>
      </svg>
    </MotionFigure>
  );
}

export function SharingArt() {
  return (
    <MotionFigure
      variant="sharing"
      caption="Eine Idee wächst, wenn wir sie weitergeben."
    >
      <svg viewBox="0 0 480 270" fill="none">
        <path
          className="network-path path-one"
          d="M60 135C142 135 134 62 230 62M60 135H230M60 135C142 135 134 208 230 208"
        />
        <path
          className="network-path path-two"
          d="M230 62C314 62 306 30 417 30M230 62C314 62 306 99 417 99M230 135H354M230 208C314 208 306 172 417 172M230 208C314 208 306 241 417 241"
        />
        <circle cx="60" cy="135" r="31" className="seed-disc" />
        <path
          d="M60 123v24m-12-12h24"
          stroke="var(--paper)"
          strokeWidth="1.5"
        />
        {[62, 135, 208].map((y) => (
          <g className="network-node node-middle" key={y}>
            <circle cx="230" cy={y} r="12" />
            <circle cx="230" cy={y} r="3" className="node-center" />
          </g>
        ))}
        {[
          [417, 30],
          [417, 99],
          [354, 135],
          [417, 172],
          [417, 241],
        ].map(([x, y]) => (
          <g className="network-node node-end" key={y}>
            <circle cx={x} cy={y} r="8" />
            <circle cx={x} cy={y} r="2" className="node-center" />
          </g>
        ))}
        <circle className="seed-halo" cx="60" cy="135" r="42" />
      </svg>
    </MotionFigure>
  );
}

export function DialogueArt() {
  return (
    <MotionFigure
      variant="dialogue"
      caption="Zwei Gedanken. Eine dritte Möglichkeit."
    >
      <svg viewBox="0 0 480 300" fill="none">
        <text x="30" y="43" className="dialogue-label">
          Ich.
        </text>
        <text x="30" y="270" className="dialogue-label">
          Du.
        </text>
        <path
          className="conversation-thread thread-one"
          d="M80 40C240 40 80 220 236 172S330 100 376 150"
        />
        <path
          className="conversation-thread thread-two"
          d="M80 260C240 260 80 80 236 128S330 200 376 150"
        />
        <g className="conversation-result">
          <circle cx="402" cy="150" r="54" />
          <text x="402" y="160" textAnchor="middle">
            Wir.
          </text>
        </g>
        <circle cx="80" cy="40" r="4" className="thread-dot" />
        <circle cx="80" cy="260" r="4" className="thread-dot" />
      </svg>
    </MotionFigure>
  );
}

import type { Choice } from '../types/scene';

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choiceId: string) => void;
  disabledIds?: Set<string>;
}

const CHOICE_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

export function ChoiceList({ choices, onChoose, disabledIds }: ChoiceListProps) {
  if (choices.length === 0) return null;

  return (
    <div
      className="mt-8"
      role="group"
      aria-label="选项列表"
      style={{ textIndent: 0 }}
    >
      <div
        className="text-xs mb-4 tracking-widest"
        style={{ color: '#8a7050', opacity: 0.7 }}
      >
        — 抉 择 —
      </div>
      {choices.map((choice, idx) => {
        const isDisabled = disabledIds?.has(choice.id) ?? false;
        return (
          <button
            key={choice.id}
            type="button"
            className="choice-item w-full text-left"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              onChoose(choice.id);
            }}
            aria-disabled={isDisabled}
          >
            <span
              className="inline-block mr-3 font-medium"
              style={{
                color: isDisabled ? '#a09080' : '#7a5a30',
                fontSize: '0.9em',
                width: '1.5em',
              }}
            >
              {CHOICE_NUMERALS[idx] ?? '·'}
            </span>
            <span style={isDisabled ? { color: '#a09080' } : undefined}>
              {choice.text}
              {isDisabled && choice.requireFailText && (
                <span
                  className="inline-block ml-3 text-xs italic"
                  style={{ color: '#a05040', opacity: 0.8 }}
                >
                  〔{choice.requireFailText}〕
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

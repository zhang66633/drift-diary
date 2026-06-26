import type { Choice } from '../types/scene';

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choiceId: string) => void;
  disabledIds?: Set<string>;
}

export function ChoiceList({ choices, onChoose, disabledIds }: ChoiceListProps) {
  if (choices.length === 0) return null;

  return (
    <div className="mt-8" role="group" aria-label="选项列表" style={{ textIndent: 0 }}>
      {choices.map((choice, idx) => {
        const isDisabled = disabledIds?.has(choice.id) ?? false;
        return (
          <button
            key={choice.id}
            type="button"
            className="choice-item w-full text-left"
            disabled={isDisabled}
            style={{
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              position: 'relative',
              background: 'transparent',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              width: '100%',
              textAlign: 'left',
            }}
            onClick={() => {
              if (isDisabled) return;
              onChoose(choice.id);
            }}
            aria-disabled={isDisabled}
          >
            <span className="mr-2" style={{ color: isDisabled ? '#999' : '#7a5a30' }}>
              {['①', '②', '③', '④', '⑤', '⑥'][idx] ?? '·'}
            </span>
            <span style={isDisabled ? { color: '#999' } : undefined}>
              {choice.text}
              {isDisabled && choice.requireFailText && (
                <span style={{ color: '#a04040', fontSize: '0.85em', marginLeft: '0.5em' }}>
                  （{choice.requireFailText}）
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

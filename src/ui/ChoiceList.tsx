import type { Choice } from '../types/scene';

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choiceId: string) => void;
  disabledIds?: Set<string>;
}

export function ChoiceList({ choices, onChoose, disabledIds }: ChoiceListProps) {
  if (choices.length === 0) return null;

  return (
    <div className="mt-8" style={{ textIndent: 0 }}>
      {choices.map((choice, idx) => {
        const isDisabled = disabledIds?.has(choice.id) ?? false;
        return (
          <div
            key={choice.id}
            className="choice-item"
            style={{
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              position: 'relative',
            }}
            onClick={() => {
              if (isDisabled) return;
              onChoose(choice.id);
            }}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={e => {
              if (isDisabled) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChoose(choice.id);
              }
            }}
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
          </div>
        );
      })}
    </div>
  );
}

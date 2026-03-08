'use client';

import React from 'react';

interface MagicMapProps {
  steps: { name: string; icon: string }[];
  currentStep: number;
  completedSteps: number[];
}

const MagicMap: React.FC<MagicMapProps> = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className="flex items-center w-full my-8 px-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = currentStep === index;
        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300"
                style={{
                  background: isCompleted
                    ? 'linear-gradient(to bottom right, #34d399, #22c55e)'
                    : isCurrent
                      ? 'linear-gradient(to bottom right, var(--kid-magic), var(--kid-primary))'
                      : undefined,
                  backgroundColor: !isCompleted && !isCurrent ? '#e5e7eb' : undefined,
                  color: !isCompleted && !isCurrent ? '#9ca3af' : undefined,
                  boxShadow: isCurrent ? 'var(--kid-shadow-magic)' : isCompleted ? '0 10px 25px rgba(34,197,94,0.2)' : undefined,
                  transform: isCurrent ? 'scale(1.1)' : undefined,
                }}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${isCurrent ? 'text-[var(--kid-primary)]' : 'text-gray-500'}`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="h-1 w-6 md:w-10 flex-shrink-0 rounded"
                style={{
                  background: isCompleted
                    ? 'linear-gradient(to right, #34d399, var(--kid-magic))'
                    : '#e5e7eb',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MagicMap;

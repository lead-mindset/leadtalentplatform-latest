import React, { useState, Children, useRef, useLayoutEffect, HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Icons } from '@/components/ui/icons';

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void | Promise<void>;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
  validateStep?: (step: number) => Promise<boolean> | boolean;
  onBeforeStepChange?: (fromStep: number, toStep: number) => Promise<boolean> | boolean;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => { },
  onFinalStepCompleted = () => { },
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Complete',
  disableStepIndicators = false,
  renderStepIndicator,
  validateStep,
  onBeforeStepChange,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      void onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return;
    }

    if (onBeforeStepChange) {
      const canProceed = await onBeforeStepChange(currentStep, currentStep + 1);
      if (!canProceed) return;
    }

    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return;
    }

    setDirection(1);
    updateStep(totalSteps + 1);
  };

  const handleStepClick = async (clicked: number) => {
    if (clicked === currentStep) return;

    if (clicked > currentStep) {
      for (let step = currentStep; step < clicked; step++) {
        if (validateStep) {
          const isValid = await validateStep(step);
          if (!isValid) return;
        }
      }
    }

    if (onBeforeStepChange) {
      const canProceed = await onBeforeStepChange(currentStep, clicked);
      if (!canProceed) return;
    }

    setDirection(clicked > currentStep ? 1 : -1);
    updateStep(clicked);
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center p-4 sm:aspect-[4/3] md:aspect-[2/1]"
      {...rest}
    >
      <div
        className={`mx-auto w-full max-w-md rounded-4xl shadow-xl ${stepCircleContainerClassName}`}
      >
        <div className={`${stepContainerClassName} flex w-full items-center p-8`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: handleStepClick
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={handleStepClick}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-8 ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-4 pb-5 sm:px-8 sm:pb-8 ${footerClassName}`}>
            <div
              className={`mt-6 flex sm:mt-10 ${currentStep !== 1 ? "justify-between" : "justify-end"
                }`}
            >
              {currentStep !== 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  {...backButtonProps}
                >
                  {backButtonText}
                </Button>
              )}

              <Button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                {...nextButtonProps}
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = '',
}: StepContentWrapperProps) {
  const [height, setHeight] = useState<number | 'auto'>(0)
  return (
    <motion.div
      animate={{ height: isCompleted ? 0 : height }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      style={{ position: 'relative', overflow: 'visible' }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={setHeight}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (h: number) => void
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      onHeightReady(entry.contentRect.height)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [onHeightReady])

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div className="px-8 ">{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
}: StepIndicatorProps) {
  const status =
    currentStep === step
      ? 'active'
      : currentStep < step
        ? 'inactive'
        : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      initial={false}
      animate={{ scale: 1 }}
      whileTap={{ scale: disableStepIndicators ? 1 : 0.95 }}
    >
      <motion.div
        transition={{ duration: 0.25 }}
        className={`
          flex h-8 w-8 items-center justify-center rounded-full font-semibold
          transition-colors
          ${status === 'inactive' &&
          'bg-muted text-muted-foreground'
          }
          ${status === 'active' &&
          'bg-primary text-primary-foreground'
          }
          ${status === 'complete' &&
          'bg-primary text-primary-foreground'
          }
        `}
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-background" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: '#5227FF' },
    complete: { width: '100%', backgroundColor: '#5227FF' }
  };

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-neutral-600">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

type CheckIconProps = React.SVGProps<SVGSVGElement>

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function FormStepper({
  children,
  initialStep = 1,
  onStepChange = () => { },
  onFinalStepCompleted = () => { },
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Complete',
  disableStepIndicators = false,
  renderStepIndicator,
  validateStep,
  onBeforeStepChange,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      void onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return;
    }

    if (onBeforeStepChange) {
      const canProceed = await onBeforeStepChange(currentStep, currentStep + 1);
      if (!canProceed) return;
    }

    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return;
    }

    setDirection(1);
    updateStep(totalSteps + 1);
  };

  const handleStepClick = async (clicked: number) => {
    if (clicked === currentStep) return;

    if (clicked > currentStep) {
      for (let step = currentStep; step < clicked; step++) {
        if (validateStep) {
          const isValid = await validateStep(step);
          if (!isValid) return;
        }
      }
    }

    if (onBeforeStepChange) {
      const canProceed = await onBeforeStepChange(currentStep, clicked);
      if (!canProceed) return;
    }

    setDirection(clicked > currentStep ? 1 : -1);
    updateStep(clicked);
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center p-4 sm:aspect-4/3 md:aspect-2/1"
      {...rest}
    >
      <div
        className={`mx-auto w-full max-w-md ${stepCircleContainerClassName} p-4`}
      >
        <div className={`${stepContainerClassName} flex w-full items-center p-8`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: handleStepClick
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={handleStepClick}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-4 pb-5 sm:px-8 sm:pb-8 ${footerClassName}`}>
            <div
              className={`mt-6 flex sm:mt-10 ${currentStep !== 1 ? "justify-between" : "justify-end"
                }`}
            >
              {currentStep !== 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  {...backButtonProps}
                >
                  {backButtonText}
                </Button>
              )}

              <Button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                {...nextButtonProps}
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  name: string;
  error?: string;
  validation?: object;
  required?: boolean;
}

export function FormInput({
  name,
  label,
  validation,
  required,
  ...props
}: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]?.message as string | undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <Input
        id={name}
        {...register(name, validation)}
        {...props}
        aria-invalid={!!error}
      />

      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <X className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}

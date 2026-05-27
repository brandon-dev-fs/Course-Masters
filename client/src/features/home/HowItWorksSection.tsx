import { Link } from 'react-router-dom';

import { BookOpen, Layers, TrendingUp, ArrowRight } from 'lucide-react';

type StepConfig = {
  badge: string;
  title: string;
  desc: string;
  icon: typeof BookOpen;
  containerClass: string;
  iconClass: string;
  badgeClass: string;
};

const STEPS: StepConfig[] = [
  {
    badge: 'Step 1',
    title: 'Build your course',
    desc: 'Create units, add lessons, upload resources and tools for your students.',
    icon: BookOpen,
    containerClass: 'bg-green-surface',
    iconClass: 'text-green-primary',
    badgeClass: 'bg-green-surface text-green-surface-text',
  },
  {
    badge: 'Step 2',
    title: 'Add learning tools',
    desc: 'Include flash cards, practice problems, and vocab to reinforce every lesson.',
    icon: Layers,
    containerClass: 'bg-blue-surface',
    iconClass: 'text-blue-accent',
    badgeClass: 'bg-blue-surface text-blue-surface-text',
  },
  {
    badge: 'Step 3',
    title: 'Track your progress',
    desc: 'Students complete lessons, take quizzes, and earn a course certificate.',
    icon: TrendingUp,
    containerClass: 'bg-orange-surface',
    iconClass: 'text-orange-surface-text',
    badgeClass: 'bg-orange-surface text-orange-surface-text',
  },
];

export default function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-background py-20 px-6"
    >
      <div className="max-w-5xl mx-auto text-center">
        <h2
          id="how-it-works-heading"
          className="text-3xl font-bold text-text-primary mb-3"
        >
          How it works
        </h2>
        <p className="text-text-secondary mb-12 text-lg">
          Go from idea to mastery in three steps.
        </p>

        <div className="relative">
          {/* Desktop connecting line */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-8 left-[17%] right-[17%] h-px bg-border-subtle"
          />
          {/* Mobile connecting line */}
          <div
            aria-hidden="true"
            className="block md:hidden absolute left-6 top-8 bottom-8 w-px bg-border-subtle"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.badge}
                  className="relative z-10 flex flex-col items-center text-center md:items-center"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative z-10 ${step.containerClass}`}
                  >
                    <Icon
                      className={`w-8 h-8 ${step.iconClass}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${step.badgeClass}`}
                  >
                    {step.badge}
                  </span>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary max-w-[200px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 mt-10 px-8 py-3.5 bg-green-button text-green-button-text font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Get started — it's free
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

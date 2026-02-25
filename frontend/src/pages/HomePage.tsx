import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Share2, Bot, BarChart3, Clock, Scale, Users, DollarSign } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();

  const steps = [
    { icon: FileText, title: t('home.features.step1.title'), desc: t('home.features.step1.desc') },
    { icon: Share2, title: t('home.features.step2.title'), desc: t('home.features.step2.desc') },
    { icon: Bot, title: t('home.features.step3.title'), desc: t('home.features.step3.desc') },
    { icon: BarChart3, title: t('home.features.step4.title'), desc: t('home.features.step4.desc') },
  ];

  const benefits = [
    { icon: Clock, text: t('home.benefits.fast') },
    { icon: Scale, text: t('home.benefits.unbiased') },
    { icon: Users, text: t('home.benefits.scalable') },
    { icon: DollarSign, text: t('home.benefits.cheap') },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <p className="text-xl text-surface-300 mb-10 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <Link to="/create" className="btn-primary text-lg inline-flex">
            {t('home.cta')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-surface-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.features.title')}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="card text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-primary-500">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
                <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-surface-300 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.benefits.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-surface-900 border border-surface-800 rounded-xl">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-primary-400" />
                </div>
                <span className="text-lg">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center card">
          <h2 className="text-2xl font-bold mb-4">Ready to streamline your hiring?</h2>
          <p className="text-surface-300 mb-6">Start with a free interview. No credit card required.</p>
          <Link to="/create" className="btn-primary inline-flex">
            {t('home.cta')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

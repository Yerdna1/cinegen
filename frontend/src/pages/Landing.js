import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FilmIcon,
  SparklesIcon,
  UserGroupIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  CheckIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id^="animate-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: FilmIcon,
      title: 'Generovanie AI videa',
      description: 'Vytvárajte ohromujúce video klipy s Hailuo 2.3 a Kling 2.6. Konzistentná kvalita, filmový výstup.',
      gradient: 'from-amber-500 to-rose-500'
    },
    {
      icon: SparklesIcon,
      title: 'Inteligentná tvorba scén',
      description: 'Inteligentné rozdelenia scén poháňané pokročilou AI. Váš príbeh, dokonale štruktúrovaný.',
      gradient: 'from-rose-500 to-amber-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Konzistencia postáv',
      description: 'Definujte postavy raz, používajte ich naprieč celým projektom. NanoBanana Pro zabezpečuje vizuálnu koherenciu.',
      gradient: 'from-amber-400 to-amber-600'
    },
    {
      icon: MicrophoneIcon,
      title: 'Prirodzený dialóg',
      description: 'Hlasy 11Labs oživia vaše postavy. Emočné, autentické a perfektne synchronizované.',
      gradient: 'from-rose-400 to-rose-600'
    }
  ];

  const workflow = [
    {
      step: '01',
      title: 'Definujte svoju víziu',
      description: 'Použite nášho sprievodcu na načrtnutie vášho príbehu, postáv a scén.'
    },
    {
      step: '02',
      title: 'AI vykoná ťažkú prácu',
      description: 'Sledujte, ako sa generujú scény, vytvárajú obrázky, nahrávajú dialógy a produkujú videá.'
    },
    {
      step: '03',
      title: 'Stiahnuť a zdieľať',
      description: 'Získajte svoje vyleštené dlhé video, pripravené očariť vaše publikum.'
    }
  ];

  return (
    <div className="min-h-screen bg-cinema-void text-cream-50 overflow-hidden">
      {/* Film grain overlay */}
      <div className="fixed inset-0 bg-noise opacity-[0.015] pointer-events-none mix-blend-overlay z-50" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-cinema-border/50 backdrop-blur-xl bg-cinema-black/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FilmIcon className="w-8 h-8 text-amber-400" />
                <div className="absolute inset-0 blur-md bg-amber-400/30" />
              </div>
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                CineGen
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-cinema-subtle hover:text-cream-50 transition-colors text-sm font-medium">
                Funkcie
              </a>
              <a href="#how-it-works" className="text-cinema-subtle hover:text-cream-50 transition-colors text-sm font-medium">
                Ako to funguje
              </a>
              <Link
                to="/login"
                className="text-cinema-subtle hover:text-cream-50 transition-colors text-sm font-medium"
              >
                Prihlásiť sa
              </Link>
              <Link
                to="/register"
                className="relative px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-cinema-black font-semibold rounded-lg overflow-hidden group"
              >
                <span className="relative z-10">Začať</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.15), transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(244, 63, 94, 0.1), transparent 60%)'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm animate-fade-in">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300 font-medium">Tvorba videa pomocou AI</span>
              </div>

              {/* Headline */}
              <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1]">
                  <span className="block text-cream-50">Premeňte príbehy na</span>
                  <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                    filmovú realitu
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-cinema-subtle max-w-xl leading-relaxed">
                  Generujte dlhé AI videá s konzistentnými postavami, inteligentnými rozdeleniami scén
                  a prirodzeným dialógom. Od konceptu po dokončenie—automaticky.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Link
                  to="/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-cinema-black font-bold rounded-xl overflow-hidden shadow-glow-lg hover:shadow-glow transition-all"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Začať tvoriť zdarma
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <button className="group px-8 py-4 border-2 border-cinema-border hover:border-amber-500/50 text-cream-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  <PlayIcon className="w-5 h-5" />
                  Sledovať demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-8 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 border-2 border-cinema-black"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="text-cream-50 font-semibold">2 000+ tvorcov</div>
                  <div className="text-cinema-muted">Tvorí s CineGen</div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-cinema-border shadow-cinema">
                {/* Placeholder for demo video/image */}
                <div className="absolute inset-0 bg-gradient-to-br from-cinema-dark via-cinema-surface to-cinema-elevated" />

                {/* Film strip effect */}
                <div className="absolute inset-y-0 left-0 w-8 bg-cinema-black border-r border-cinema-border flex flex-col justify-evenly items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-4 h-3 bg-cinema-surface rounded-sm" />
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-8 bg-cinema-black border-l border-cinema-border flex flex-col justify-evenly items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-4 h-3 bg-cinema-surface rounded-sm" />
                  ))}
                </div>

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <VideoCameraIcon className="w-24 h-24 text-amber-400/30" />
                    <div className="absolute inset-0 blur-2xl bg-amber-400/20" />
                  </div>
                </div>

                {/* Scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/5 to-transparent animate-film-grain pointer-events-none" />
              </div>

              {/* Floating cards */}
              <div
                className="absolute -top-6 -right-6 px-4 py-3 bg-cinema-elevated/90 backdrop-blur-sm border border-amber-500/20 rounded-xl shadow-elevated"
                style={{ transform: `translateY(${scrollY * -0.05}px)` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-amber-300">Generuje sa...</span>
                </div>
              </div>

              <div
                className="absolute -bottom-6 -left-6 px-4 py-3 bg-cinema-elevated/90 backdrop-blur-sm border border-rose-500/20 rounded-xl shadow-elevated"
                style={{ transform: `translateY(${scrollY * -0.03}px)` }}
              >
                <div className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-rose-400" />
                  <span className="text-sm font-medium">Scéna 24 dokončená</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div
            id="animate-features-header"
            className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
              isVisible['animate-features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                Všetko, čo potrebujete
              </span>
              <span className="block text-cream-50 mt-2">na tvorbu pútavých videí</span>
            </h2>
            <p className="text-lg text-cinema-subtle">
              Výkonné AI nástroje pracujúce v harmónii na premenu vašej kreatívnej vízie na realitu.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  id={`animate-feature-${index}`}
                  key={index}
                  className={`group relative p-8 bg-cinema-surface/50 backdrop-blur-sm border border-cinema-border rounded-2xl hover:border-amber-500/30 transition-all duration-500 ${
                    isVisible[`animate-feature-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-2xl`} />
                  </div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="relative inline-block">
                        <div className={`absolute inset-0 blur-xl bg-gradient-to-br ${feature.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                        <div className={`relative p-3 bg-gradient-to-br ${feature.gradient} rounded-xl`}>
                          <Icon className="w-6 h-6 text-cinema-black" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-cream-50 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-cinema-subtle leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-cinema-void via-cinema-surface/20 to-cinema-void" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div
            id="animate-workflow-header"
            className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 ${
              isVisible['animate-workflow-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6 text-cream-50">
              Od nápadu k videu v{' '}
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                troch krokoch
              </span>
            </h2>
            <p className="text-lg text-cinema-subtle">
              Náš zjednodušený pracovný postup vás prevedie od konceptu po dokončené video bez námahy.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/20 via-amber-500/50 to-amber-500/20 -translate-y-1/2" />

            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
              {workflow.map((item, index) => (
                <div
                  id={`animate-workflow-${index}`}
                  key={index}
                  className={`relative transition-all duration-1000 ${
                    isVisible[`animate-workflow-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Step number with glow */}
                  <div className="relative mb-6">
                    <div className="inline-block">
                      <div className="absolute inset-0 blur-2xl bg-amber-400/30" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow">
                        <span className="text-2xl font-display font-bold text-cinema-black">
                          {item.step}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-display font-bold text-cream-50 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-cinema-subtle leading-relaxed">
                    {item.description}
                  </p>

                  {/* Arrow (desktop only, not on last item) */}
                  {index < workflow.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-12 text-amber-500/30">
                      <ArrowRightIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div
            id="animate-cta"
            className={`relative p-12 lg:p-16 rounded-3xl overflow-hidden transition-all duration-1000 ${
              isVisible['animate-cta'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cinema-surface to-cinema-elevated border border-cinema-border" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-rose-500/10" />

            {/* Content */}
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl lg:text-5xl font-display font-bold">
                <span className="block text-cream-50 mb-2">Pripravení tvoriť?</span>
                <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                  Začnite svoj prvý projekt dnes
                </span>
              </h2>

              <p className="text-lg text-cinema-subtle max-w-2xl mx-auto">
                Pridajte sa k tisíckam tvorcov používajúcich CineGen na oživenie svojich príbehov.
                Prineste si vlastné API kľúče a začnite generovať videá za pár minút.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/register"
                  className="group relative px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-cinema-black font-bold rounded-xl overflow-hidden shadow-glow-lg hover:shadow-glow transition-all"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Začať zdarma
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  to="/login"
                  className="px-10 py-4 border-2 border-cinema-border hover:border-amber-500/50 text-cream-50 font-bold rounded-xl transition-all"
                >
                  Prihlásiť sa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-cinema-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <FilmIcon className="w-6 h-6 text-amber-400" />
              <span className="text-xl font-display font-bold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                CineGen
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 text-sm text-cinema-subtle">
              <a href="#features" className="hover:text-cream-50 transition-colors">Funkcie</a>
              <a href="#how-it-works" className="hover:text-cream-50 transition-colors">Ako to funguje</a>
              <Link to="/help" className="hover:text-cream-50 transition-colors">Pomoc</Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-cinema-muted">
              © 2024 CineGen. Všetky práva vyhradené.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

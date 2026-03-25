"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, TrendingUp, Users, DollarSign, Building } from "lucide-react";
import BlueprintAnimation from "@/components/BlueprintAnimation";
import MiniGanttDemo from "@/components/MiniGanttDemo";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-dark min-h-screen bg-background text-foreground">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-syne text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>Aedis</div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" style={{ color: 'rgba(255,255,255,0.55)' }} className="hover:text-foreground transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>Fonctionnalités</a>
            <a href="#how-it-works" style={{ color: 'rgba(255,255,255,0.55)' }} className="hover:text-foreground transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>Comment ça marche</a>
            <a href="#roles" style={{ color: 'rgba(255,255,255,0.55)' }} className="hover:text-foreground transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>Rôles</a>
          </div>
          <Link
            href="/auth"
            style={{
              background: 'rgba(255,122,61,0.12)',
              border: '1px solid rgba(255,122,61,0.25)',
              color: 'rgba(255,122,61,0.8)',
              padding: '7px 16px',
              fontSize: '12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,122,61,0.2)';
              e.currentTarget.style.color = 'rgba(255,122,61,1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,122,61,0.12)';
              e.currentTarget.style.color = 'rgba(255,122,61,0.8)';
            }}
          >
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000510'
      }}>
        {/* Animation fills hero only */}
        <BlueprintAnimation />

        {/* Vignette inside hero only */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,5,16,0.75) 100%)'
        }} />

        {/* Hero content bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          zIndex: 2,
          textAlign: 'left',
          maxWidth: '480px',
          padding: '0'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,122,61,0.07)',
            border: '1px solid rgba(255,122,61,0.18)',
            color: 'rgba(255,122,61,0.7)',
            padding: '4px 12px',
            borderRadius: '100px',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            opacity: 0.8
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'rgba(255,122,61,0.8)',
              display: 'inline-block'
            }} />
            Suivi de chantier nouvelle génération
          </div>

          <h1 style={{
            fontSize: 'clamp(24px, 3vw, 40px)',
            fontWeight: '600',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.82)',
            marginBottom: '12px',
            fontFamily: 'var(--font-syne)'
          }}>
            Gérez vos chantiers.<br/>
            <em style={{ fontStyle: 'normal', color: 'rgba(255,122,61,0.75)' }}>
              Votre réputation suit.
            </em>
          </h1>

          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.38)',
            lineHeight: '1.6',
            marginBottom: '24px',
            fontWeight: '300',
            maxWidth: '360px'
          }}>
            La plateforme collaborative qui connecte architectes, artisans et clients autour d'un seul outil.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2"
              style={{
                background: 'rgba(255,122,61,0.7)',
                border: '1px solid rgba(255,122,61,0.4)',
                color: 'rgba(255,255,255,0.9)',
                padding: '9px 20px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '6px',
                letterSpacing: '0.02em',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'background 0.2s, opacity 0.2s',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,122,61,0.9)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,122,61,0.7)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              Démarrer gratuitement
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: '400',
                borderRadius: '6px',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,122,61,0.3)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <Play className="w-3 h-3" />
              Voir la démo
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '5%',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.25
        }}>
          <div style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)'
          }} />
        </div>

        {/* Bottom fade inside hero */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '180px',
          background: 'linear-gradient(to bottom, transparent, #000510)',
          zIndex: 3,
          pointerEvents: 'none'
        }} />
      </section>

      {/* Stats Bar */}
      <section
        style={{
          background: '#000510',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{
          background: '#000510',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '80px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '32px',
              color: 'white',
              marginBottom: '4px'
            }}>5h</div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>gagnées par semaine</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '32px',
              color: 'white',
              marginBottom: '4px'
            }}>3</div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>rôles connectés</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '32px',
              color: 'white',
              marginBottom: '4px'
            }}>0€</div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>pour les artisans</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '32px',
              color: 'white',
              marginBottom: '4px'
            }}>118Md€</div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>marché rénovation france</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" style={{ background: '#000510' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-syne mb-6">
              Tout ce dont vous avez besoin pour{" "}
              <span className="italic text-accent">réussir</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d&apos;outils pensés pour l&apos;architecture moderne
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Planning intelligent",
                description: "Lots, dépendances, alertes auto",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>
                  </svg>
                )
              },
              {
                title: "Portail client temps réel",
                description: "Lien unique sans compte",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                )
              },
              {
                title: "Réputation vérifiée",
                description: "Portfolio auto-généré",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )
              },
              {
                title: "Communication structurée",
                description: "Messagerie par tâche",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                )
              },
              {
                title: "Rapports PDF auto",
                description: "Compte-rendu en un clic",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6M9 13l2 2 4-4"/>
                  </svg>
                )
              },
              {
                title: "Gestion des réserves",
                description: "Suivi levée de réserve",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 0,
                  padding: '40px 32px',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255,122,61,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div
                  className="mb-4"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255,122,61,0.1)',
                    border: '1px solid rgba(255,122,61,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF7A3D'
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    opacity: 0.9
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: '1.7'
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20" style={{ background: '#000510' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-syne">
                Comment ça <span className="italic text-accent">marche</span>
              </h2>

              {[
                {
                  step: "01",
                  title: "L'archi crée le chantier",
                  description: "Définit les tâches, les lots et les dépendances en quelques clics"
                },
                {
                  step: "02",
                  title: "Les artisans valident avec photos",
                  description: "Chaque corps de métier confirme l'avancement et documente son travail"
                },
                {
                  step: "03",
                  title: "Le client voit tout en temps réel",
                  description: "Accès permanent à l'état d'avancement sans créer de compte"
                },
                {
                  step: "04",
                  title: "Le portfolio se construit seul",
                  description: "Vos projets réussis alimentent automatiquement votre réputation"
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div style={{
                    color: '#FF7A3D',
                    fontFamily: 'var(--font-syne)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>{item.step}</div>
                  <div>
                    <h3 style={{
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>{item.title}</h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: '1.6'
                    }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: 'sticky', top: '120px' }}>
              <MiniGanttDemo />
            </div>
          </div>
        </div>
      </section>

      {/* 3 Roles Section */}
      <section id="roles" className="py-20" style={{ background: '#000510' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-syne mb-6">
              Trois rôles, <span className="italic text-accent">une vision</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Architecte</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Économise 5h/semaine</li>
                <li>• Zéro appel client</li>
                <li>• Portfolio automatique</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Artisan</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Gratuit à vie</li>
                <li>• Sa liste de tâches</li>
                <li>• Réputation vérifiable</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Client</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Lien unique d&apos;acc&egrave;s</li>
                <li>• Progression temps réel</li>
                <li>• Timeline avec photos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-20" style={{ background: '#000510' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-syne mb-6">
            Votre prochain chantier mérite mieux que <span className="italic text-accent">WhatsApp</span>
          </h2>

          {submitted ? (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
              <p className="text-accent font-semibold">Merci ! Vous serez parmi les premiers informés.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : "Demander l'accès"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: '#000510', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">© 2026 Aedis · du latin aedes : l&apos;édifice</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

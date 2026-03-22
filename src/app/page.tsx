"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, TrendingUp, Users, DollarSign, Building } from "lucide-react";

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
          <div className="font-dm-serif text-xl text-foreground">Aedis</div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">Rôles</a>
          </div>
          <Link
            href="/auth"
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background Container */}
        <div className="absolute inset-0 z-0">
          <ThreeJSBackground />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center bg-card border border-border rounded-full px-4 py-2 mb-8">
            <span className="text-sm text-muted-foreground">Suivi de chantier nouvelle génération</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-dm-serif leading-tight mb-6">
            Gérez vos chantiers.{" "}
            <span className="italic text-accent">Votre réputation suit.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            La plateforme collaborative qui connecte architectes, artisans et clients autour d&apos;un seul outil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 rounded-lg font-medium inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="border border-border hover:bg-card text-foreground px-8 py-4 rounded-lg font-medium inline-flex items-center gap-2 transition-colors">
              <Play className="w-4 h-4" />
              Voir la démo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">5h</div>
              <div className="text-sm text-muted-foreground">gagnées par semaine</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">3</div>
              <div className="text-sm text-muted-foreground">rôles connectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">0€</div>
              <div className="text-sm text-muted-foreground">pour les artisans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">118Md€</div>
              <div className="text-sm text-muted-foreground">marché rénovation France</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-dm-serif mb-6">
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
                icon: "📊"
              },
              {
                title: "Portail client temps réel",
                description: "Lien unique sans compte",
                icon: "🔗"
              },
              {
                title: "Réputation vérifiée",
                description: "Portfolio auto-généré",
                icon: "⭐"
              },
              {
                title: "Communication structurée",
                description: "Messagerie par tâche",
                icon: "💬"
              },
              {
                title: "Rapports PDF auto",
                description: "Compte-rendu en un clic",
                icon: "📄"
              },
              {
                title: "Gestion des réserves",
                description: "Suivi levée de réserve",
                icon: "✅"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-8 hover:border-accent/50 transition-colors">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-dm-serif">
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
                  <div className="text-accent font-dm-serif text-lg font-bold">Step {item.step}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl p-8 aspect-square flex items-center justify-center">
              <div className="text-center">
                <Building className="w-16 h-16 text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Interface collaborative en action</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Roles Section */}
      <section id="roles" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-dm-serif mb-6">
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
      <section className="py-20 bg-card/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-dm-serif mb-6">
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
      <footer className="border-t border-border py-12">
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

// Three.js Background Component
function ThreeJSBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    // Only load on desktop to avoid mobile performance issues
    if (window.innerWidth < 768) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scene: any, camera: any, renderer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const buildings: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let animationId: number;

    const init = async () => {
      try {
        // Dynamic import of Three.js
        const THREE = await import("three");

        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        const container = document.getElementById("threejs-container");
        if (container) {
          container.appendChild(renderer.domElement);
        }

        // Grid floor
        const gridHelper = new THREE.GridHelper(100, 50, 0xE8650A, 0x333333);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Create buildings
        for (let i = 0; i < 20; i++) {
          const height = Math.random() * 10 + 2;
          const geometry = new THREE.BoxGeometry(
            Math.random() * 2 + 0.5,
            height,
            Math.random() * 2 + 0.5
          );

          const material = new THREE.MeshBasicMaterial({
            color: Math.random() < 0.3 ? 0xE8650A : 0x333333,
            wireframe: true,
            transparent: true,
            opacity: 0.6
          });

          const building = new THREE.Mesh(geometry, material);
          building.position.x = (Math.random() - 0.5) * 40;
          building.position.z = (Math.random() - 0.5) * 40;
          building.position.y = height / 2;

          buildings.push(building);
          scene.add(building);
        }

        // Floating particles
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 100;
          positions[i + 1] = Math.random() * 50;
          positions[i + 2] = (Math.random() - 0.5) * 100;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
          color: 0xE8650A,
          size: 0.5,
          transparent: true,
          opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Camera position
        camera.position.set(15, 8, 15);
        camera.lookAt(0, 0, 0);

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate);

          // Rotate camera slowly
          const time = Date.now() * 0.0005;
          camera.position.x = Math.cos(time) * 15;
          camera.position.z = Math.sin(time) * 15;
          camera.lookAt(0, 0, 0);

          // Animate buildings growing
          buildings.forEach((building, index) => {
            const scale = Math.sin(time + index * 0.5) * 0.1 + 1;
            building.scale.y = scale;
          });

          // Animate particles
          const positions = particles.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.02;
            if (positions[i] > 50) positions[i] = 0;
          }
          particles.geometry.attributes.position.needsUpdate = true;

          renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
        };
      } catch (error) {
        console.error("Three.js failed to load:", error);
      }
    };

    init();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5" />
    );
  }

  return (
    <>
      <div id="threejs-container" className="absolute inset-0 hidden md:block" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5 md:hidden" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
    </>
  );
}
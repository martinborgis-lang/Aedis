"use client";

import Link from "next/link";
import { CalendarDays, Link2, Camera } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-primary">Aedis</h1>
            <Link
              href="/dashboard"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-6">
              Suivi de chantier simplifié
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Aidez les architectes et artisans à suivre efficacement leurs projets de construction avec nos outils collaboratifs
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-lg border text-center">
                <CalendarDays className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Planification Gantt</h3>
                <p className="text-muted-foreground">
                  Organisez vos tâches et suivez l&apos;avancement de vos projets avec des diagrammes de Gantt intuitifs
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg border text-center">
                <Link2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Portail Client</h3>
                <p className="text-muted-foreground">
                  Partagez l&apos;avancement en temps réel avec vos clients grâce à un portail dédié et sécurisé
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg border text-center">
                <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Photos de chantier</h3>
                <p className="text-muted-foreground">
                  Documentez l&apos;évolution de vos chantiers avec des photos géolocalisées et organisées par date
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

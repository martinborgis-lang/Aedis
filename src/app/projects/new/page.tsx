"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [client_name, setClientName] = useState("");
  const [client_email, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const portal_token = uuidv4();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Connectez-vous pour créer un projet");
        router.push("/dashboard");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          name,
          address,
          client_name,
          client_email: client_email || null,
          portal_token,
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-xl font-semibold">Aedis</span>
          </div>
          <h1 className="text-3xl font-bold">Nouveau Projet</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nom du projet
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Adresse du chantier
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="client_name" className="block text-sm font-medium mb-2">
              Nom du client
            </label>
            <input
              id="client_name"
              type="text"
              value={client_name}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="client_email" className="block text-sm font-medium mb-2">
              Email du client
            </label>
            <input
              id="client_email"
              type="email"
              value={client_email}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="text-danger text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white w-full py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le projet"}
          </button>
        </form>
      </div>
    </div>
  );
}
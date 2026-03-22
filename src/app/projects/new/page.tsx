"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Edit } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ImportUploadZone from "@/components/ImportUploadZone";

interface FormErrors {
  name?: string;
  address?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  dates?: string;
}

export default function NewProjectPage() {
  const [mode, setMode] = useState<'manual' | 'import'>('manual');
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Le nom du projet est requis";
    }

    if (!address.trim()) {
      newErrors.address = "L\u2019adresse du chantier est requise";
    }

    if (!clientName.trim()) {
      newErrors.client_name = "Le nom du client est requis";
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.client_email = "L\u2019adresse email n\u2019est pas valide";
    }

    if (clientPhone && !/^[+\d\s()-]{6,20}$/.test(clientPhone)) {
      newErrors.client_phone =
        "Le num\u00e9ro de t\u00e9l\u00e9phone n\u2019est pas valide";
    }

    if (startDate && estimatedEndDate && startDate > estimatedEndDate) {
      newErrors.dates =
        "La date de fin estim\u00e9e doit \u00eatre apr\u00e8s la date de d\u00e9but";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const portal_token = uuidv4();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          address: address.trim(),
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          description: description.trim() || null,
          start_date: startDate || null,
          estimated_end_date: estimatedEndDate || null,
          portal_token,
          portal_enabled: false,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        showToast(
          "error",
          `Erreur lors de la cr\u00e9ation : ${insertError.message}`
        );
        return;
      }

      showToast("success", "Projet cr\u00e9\u00e9 avec succ\u00e8s !");
      setTimeout(() => router.push(`/projects/${data.id}`), 500);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldError?: string) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors ${
      fieldError ? "border-destructive" : ""
    }`;

  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-soft text-sm ${
            toast.type === "success"
              ? "bg-success/10 text-success border-success/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-lg font-semibold tracking-tight text-primary">Aedis</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Nouveau Projet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'manual'
              ? "Remplissez les informations pour créer un nouveau chantier"
              : "Importez votre DPGF pour créer automatiquement le projet"
            }
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setMode('manual')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${mode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Edit className="h-4 w-4" />
            Créer manuellement
          </button>
          <button
            onClick={() => setMode('import')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${mode === 'import'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <FileText className="h-4 w-4" />
            Importer un devis PDF
          </button>
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Nom du projet <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: R\u00e9novation Villa Dupont"
                className={inputClass(errors.name)}
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1.5">
                Adresse du chantier <span className="text-destructive">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: 15 Rue de la Paix, 75001 Paris"
                className={inputClass(errors.address)}
              />
              {errors.address && (
                <p className="text-destructive text-xs mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1.5">
                Description du projet
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="D\u00e9crivez le projet, le p\u00e9rim\u00e8tre des travaux..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Client</h3>
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium mb-1.5">
                Nom du client <span className="text-destructive">*</span>
              </label>
              <input
                id="client_name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Famille Dupont"
                className={inputClass(errors.client_name)}
              />
              {errors.client_name && (
                <p className="text-destructive text-xs mt-1">{errors.client_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="client_email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="client_email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@email.com"
                  className={inputClass(errors.client_email)}
                />
                {errors.client_email && (
                  <p className="text-destructive text-xs mt-1">{errors.client_email}</p>
                )}
              </div>

              <div>
                <label htmlFor="client_phone" className="block text-sm font-medium mb-1.5">
                  T&eacute;l&eacute;phone
                </label>
                <input
                  id="client_phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={inputClass(errors.client_phone)}
                />
                {errors.client_phone && (
                  <p className="text-destructive text-xs mt-1">{errors.client_phone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium mb-1.5">
                  Date de d&eacute;but
                </label>
                <input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium mb-1.5">
                  Date de fin estim&eacute;e
                </label>
                <input
                  id="end_date"
                  type="date"
                  value={estimatedEndDate}
                  onChange={(e) => setEstimatedEndDate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
            </div>
            {errors.dates && (
              <p className="text-destructive text-xs">{errors.dates}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cr\u00e9ation en cours..." : "Cr\u00e9er le projet"}
          </button>
        </form>
        ) : (
          <ImportUploadZone />
        )}
      </div>
    </div>
  );
}

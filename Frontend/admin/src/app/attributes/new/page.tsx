"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAttribute } from "@/features/admin-catalog/services/catalog.service";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function CreateAttributeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState("STRING");
  const [inputType, setInputType] = useState("TEXT");
  const [optionsText, setOptionsText] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const options =
        dataType === "ENUM" || dataType === "MULTI_SELECT"
          ? optionsText
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [value, label] = line.split("|").map((s) => s.trim());
                return { value, label: label || value };
              })
          : [];
      const res = await createAttribute({
        name,
        code,
        description,
        dataType,
        inputType,
        options,
        unit: unit || null,
      });
      router.replace(`/attributes/${res.data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/attributes"
          className="text-sm text-emporia-teal underline-offset-4 hover:underline"
        >
          Back to attributes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
          Create attribute
        </h1>
      </div>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <form
        className="space-y-4 border border-emporia-border bg-white/90 p-5"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code (immutable)</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dataType">Data type</Label>
            <select
              id="dataType"
              className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              {["STRING", "NUMBER", "BOOLEAN", "ENUM", "MULTI_SELECT", "DATE"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inputType">Input type</Label>
            <select
              id="inputType"
              className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
            >
              {[
                "TEXT",
                "TEXTAREA",
                "NUMBER",
                "SELECT",
                "MULTI_SELECT",
                "CHECKBOX",
                "DATE",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(dataType === "ENUM" || dataType === "MULTI_SELECT") && (
          <div className="space-y-2">
            <Label htmlFor="options">Options (one per line: value|label)</Label>
            <textarea
              id="options"
              className="min-h-28 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={"s|S\nm|M\nl|L"}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="unit">Unit (optional)</Label>
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create attribute"}
        </Button>
      </form>
    </div>
  );
}

export default function NewAttributePage() {
  return (
    <AdminGuard>
      <PortalChrome title="Create attribute" wide>
        <CreateAttributeForm />
      </PortalChrome>
    </AdminGuard>
  );
}

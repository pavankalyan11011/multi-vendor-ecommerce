"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAttribute,
  setAttributeStatus,
  updateAttribute,
} from "@/features/admin-catalog/services/catalog.service";
import type { Attribute } from "@/features/admin-catalog/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function AttributeEditor() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Attribute | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [bump, setBump] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getAttribute(params.id)
      .then((res) => {
        setItem(res.data);
        setOptionsText(
          (res.data.options || [])
            .map((o) => `${o.value}|${o.label}`)
            .join("\n")
        );
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [params.id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const options =
        item.dataType === "ENUM" || item.dataType === "MULTI_SELECT"
          ? optionsText
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [value, label] = line.split("|").map((s) => s.trim());
                return { value, label: label || value };
              })
          : undefined;
      const res = await updateAttribute(item.id, {
        name: item.name,
        description: item.description,
        inputType: item.inputType,
        unit: item.unit,
        options,
        bumpSchemaVersion: bump,
      });
      setItem(res.data);
      setNote("Attribute updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!item && !error) {
    return <p className="text-sm text-emporia-muted">Loading...</p>;
  }
  if (!item) {
    return <Alert variant="destructive">{error || "Not found"}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/attributes"
            className="text-sm text-emporia-teal underline-offset-4 hover:underline"
          >
            Back to attributes
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
            {item.name}
          </h1>
          <p className="text-sm text-emporia-muted">
            code <code>{item.code}</code> · {item.dataType} · v{item.schemaVersion} ·{" "}
            {item.status}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void setAttributeStatus(
              item.id,
              item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
            ).then((res) => setItem(res.data))
          }
        >
          {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {note ? <Alert variant="success">{note}</Alert> : null}

      <form
        className="space-y-4 border border-emporia-border bg-white/90 p-5"
        onSubmit={onSave}
      >
        <Alert>
          Attribute <strong>code</strong> and <strong>dataType</strong> cannot
          change after creation. Use schema version bumps when option semantics
          change for Phase 3B products.
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={item.name}
            onChange={(e) => setItem({ ...item, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inputType">Input type</Label>
            <select
              id="inputType"
              className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
              value={item.inputType}
              onChange={(e) =>
                setItem({
                  ...item,
                  inputType: e.target.value as Attribute["inputType"],
                })
              }
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
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={item.unit || ""}
              onChange={(e) =>
                setItem({ ...item, unit: e.target.value || null })
              }
            />
          </div>
        </div>
        {(item.dataType === "ENUM" || item.dataType === "MULTI_SELECT") && (
          <div className="space-y-2">
            <Label htmlFor="options">Options (value|label)</Label>
            <textarea
              id="options"
              className="min-h-28 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bump}
            onChange={(e) => setBump(e.target.checked)}
          />
          Bump schemaVersion (signal Phase 3B products to re-validate)
        </label>
        <Button type="submit" disabled={busy}>
          Save attribute
        </Button>
      </form>
    </div>
  );
}

export default function AttributeDetailPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Edit attribute" wide>
        <AttributeEditor />
      </PortalChrome>
    </AdminGuard>
  );
}

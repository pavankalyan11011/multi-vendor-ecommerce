"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormSchemaField } from "@/features/vendor-products/types";

export type AttributeValueMap = Record<string, unknown>;

export function DynamicAttributeFields({
  fields,
  values,
  onChange,
  excludeVariantDefining = false,
}: {
  fields: FormSchemaField[];
  values: AttributeValueMap;
  onChange: (code: string, value: unknown) => void;
  excludeVariantDefining?: boolean;
}) {
  const visible = fields.filter((f) =>
    excludeVariantDefining ? !f.variantDefining : true
  );

  if (!visible.length) {
    return (
      <p className="text-sm text-emporia-muted">
        No attributes configured for this category.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((field) => {
        const id = `attr-${field.code}`;
        const value = values[field.code];
        const unit = field.unit ? ` (${field.unit})` : "";
        return (
          <div key={field.attributeId} className="space-y-2">
            <Label htmlFor={id}>
              {field.name}
              {unit}
              {field.required ? " *" : ""}
            </Label>
            {field.description ? (
              <p className="text-xs text-emporia-muted">{field.description}</p>
            ) : null}
            {renderInput(field, id, value, onChange)}
          </div>
        );
      })}
    </div>
  );
}

function renderInput(
  field: FormSchemaField,
  id: string,
  value: unknown,
  onChange: (code: string, value: unknown) => void
) {
  if (field.dataType === "BOOLEAN" || field.inputType === "CHECKBOX") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.code, e.target.checked)}
        />
        Yes
      </label>
    );
  }

  if (field.dataType === "ENUM" || field.inputType === "SELECT") {
    return (
      <select
        id={id}
        className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
        value={String(value ?? "")}
        onChange={(e) => onChange(field.code, e.target.value)}
        required={field.required}
      >
        <option value="">Select…</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.dataType === "MULTI_SELECT") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-1">
        {field.options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, o.value]
                  : selected.filter((v) => v !== o.value);
                onChange(field.code, next);
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.dataType === "NUMBER" || field.inputType === "NUMBER") {
    return (
      <Input
        id={id}
        type="number"
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) =>
          onChange(
            field.code,
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
        required={field.required}
      />
    );
  }

  if (field.dataType === "DATE" || field.inputType === "DATE") {
    return (
      <Input
        id={id}
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(field.code, e.target.value)}
        required={field.required}
      />
    );
  }

  if (field.inputType === "TEXTAREA") {
    return (
      <textarea
        id={id}
        className="min-h-24 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
        value={String(value ?? "")}
        onChange={(e) => onChange(field.code, e.target.value)}
        required={field.required}
      />
    );
  }

  return (
    <Input
      id={id}
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(field.code, e.target.value)}
      required={field.required}
    />
  );
}

export function valuesToPayload(
  fields: FormSchemaField[],
  values: AttributeValueMap
) {
  return fields
    .filter((f) => values[f.code] !== undefined && values[f.code] !== "")
    .map((f) => ({
      attributeId: f.attributeId,
      code: f.code,
      value: values[f.code],
    }));
}

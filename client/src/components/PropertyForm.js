import React, { useState, useEffect } from 'react';
import {
  Button, Checkbox, Form, Header, Icon,
  Input, Label, Modal, Segment, Select, Table, Message,
} from 'semantic-ui-react';

import propertySchema from '../schema/property.schema.json';
import addressSchema  from '../schema/address.schema.json';
import creditCardSchema from '../schema/creditCard.schema.json';

// ─── Schema registry (resolves cross-file $ref) ───────────────────────────────
const REGISTRY = {
  'https://example.com/schemas/property.json':  propertySchema,
  'https://example.com/schemas/address.json':   addressSchema,
  'https://example.com/schemas/creditCard.json': creditCardSchema,
};

// Fields never exposed in the UI
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_id', '__v']);

// ─── Schema helpers ───────────────────────────────────────────────────────────

/** Resolve a $ref string. Handles both local (#/$defs/…) and registry refs. */
function resolveRef(ref, contextSchema) {
  if (!ref) return null;
  if (ref.startsWith('#')) {
    const parts = ref.slice(1).split('/').filter(Boolean);
    let node = contextSchema;
    for (const p of parts) node = node?.[p];
    return node ?? null;
  }
  const [base] = ref.split('#');
  return REGISTRY[base] ?? null;
}

/** Resolve the item schema of an array property. */
function resolveItemSchema(arraySchemaDef, contextSchema) {
  const items = arraySchemaDef?.items;
  if (!items) return null;
  if (items.$ref) return resolveRef(items.$ref, contextSchema);
  return items;
}

/**
 * Classify how a schema property should be rendered.
 * Returns: 'system' | 'title-value' | 'scalar' | 'boolean' | 'array'
 *
 * - title-value : { type:'object', properties:{ title:{const}, value:{…} } }
 *   → rendered as an inline form input labelled by `title.const`
 * - array        → rendered as a clickable navigation row
 * - scalar       → string / integer / number with optional enum
 * - boolean      → toggle checkbox
 */
function classifyField(key, propDef) {
  if (SYSTEM_FIELDS.has(key)) return 'system';
  if (propDef.type === 'array') return 'array';
  if (
    propDef.type === 'object' &&
    propDef.properties?.title?.const !== undefined &&
    propDef.properties?.value !== undefined
  ) return 'title-value';
  if (propDef.type === 'boolean') return 'boolean';
  return 'scalar'; // string, integer, number (flat)
}

/** Return a sensible empty/default value for a schema node. */
function defaultForSchema(schema) {
  if (!schema) return '';
  if (schema.default !== undefined) return schema.default;
  if (schema.enum) return schema.enum[0] ?? '';
  switch (schema.type) {
    case 'array':   return [];
    case 'object':  return {};
    case 'boolean': return false;
    case 'integer':
    case 'number':  return 0;
    default:        return '';
  }
}

/** Build an empty data object matching a given schema. */
function buildEmpty(schema) {
  if (!schema) return {};
  const result = {};
  for (const [key, propDef] of Object.entries(schema.properties ?? {})) {
    const kind = classifyField(key, propDef);
    if (kind === 'system') continue;
    if (kind === 'title-value') {
      result[key] = {
        title: propDef.properties.title.const,
        value: defaultForSchema(propDef.properties.value),
      };
    } else if (kind === 'array') {
      result[key] = [];
    } else if (kind === 'boolean') {
      result[key] = false;
    } else {
      result[key] = defaultForSchema(propDef);
    }
  }
  return result;
}

/** Return a human-readable label for an array item (for list rows). */
function itemDisplayLabel(itemData, iSchema, index) {
  if (!itemData) return `Item ${index + 1}`;
  if (typeof itemData.nickname === 'string' && itemData.nickname) return itemData.nickname;
  for (const [key, propDef] of Object.entries(iSchema?.properties ?? {})) {
    const kind = classifyField(key, propDef);
    if (kind === 'title-value') {
      const v = itemData[key]?.value;
      if (typeof v === 'string' && v) return v;
    }
    if (propDef.type === 'string' && typeof itemData[key] === 'string' && itemData[key]) {
      return itemData[key];
    }
  }
  return `Item ${index + 1}`;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function validateScalarValue(value, schema, label) {
  const errors = [];

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${label} must be one of the allowed values.`);
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${label} must be a string.`);
      return errors;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${label} is required.`);
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(`${label} is invalid.`);
      }
    }
    return errors;
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      errors.push(`${label} is required.`);
      return errors;
    }
    if (schema.type === 'integer' && !Number.isInteger(value)) {
      errors.push(`${label} must be a whole number.`);
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${label} must be at least ${schema.minimum}.`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${label} must be at most ${schema.maximum}.`);
    }
    return errors;
  }

  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${label} is required.`);
  }

  return errors;
}

function validateDataAgainstSchema(data, schema, contextSchema, pathLabel = schema?.title ?? 'Form') {
  if (!schema || typeof schema !== 'object') return [];

  const ctx = contextSchema ?? schema;
  const errors = [];
  const requiredSet = new Set(schema.required ?? []);

  for (const [key, propDef] of Object.entries(schema.properties ?? {})) {
    if (SYSTEM_FIELDS.has(key)) continue;

    const label = propDef.title ?? propDef.properties?.title?.const ?? key;
    const nextLabel = pathLabel ? `${pathLabel} > ${label}` : label;
    const kind = classifyField(key, propDef);
    const value = data?.[key];
    const isRequired = requiredSet.has(key);

    if (kind === 'array') {
      if (!Array.isArray(value)) {
        if (isRequired) errors.push(`${nextLabel} is required.`);
        continue;
      }
      const itemSchema = resolveItemSchema(propDef, ctx);
      value.forEach((item, index) => {
        const itemLabel = `${nextLabel} ${index + 1}`;
        if (itemSchema?.type === 'object') {
          errors.push(...validateDataAgainstSchema(item, itemSchema, itemSchema?.$id ? itemSchema : ctx, itemLabel));
        }
      });
      continue;
    }

    if (kind === 'title-value') {
      const valueSchema = propDef.properties?.value;
      const actualValue = value?.value;
      if (isRequired && isEmptyValue(actualValue)) {
        errors.push(`${nextLabel} is required.`);
        continue;
      }
      if (!isEmptyValue(actualValue)) {
        errors.push(...validateScalarValue(actualValue, valueSchema, nextLabel));
      }
      continue;
    }

    if (kind === 'boolean') {
      if (isRequired && typeof value !== 'boolean') {
        errors.push(`${nextLabel} is required.`);
      }
      continue;
    }

    if (isRequired && isEmptyValue(value)) {
      errors.push(`${nextLabel} is required.`);
      continue;
    }

    if (!isEmptyValue(value)) {
      errors.push(...validateScalarValue(value, propDef, nextLabel));
    }
  }

  return errors;
}

function validateField(propDef, value, isRequired, label, contextSchema) {
  const kind = classifyField(label, propDef);

  if (kind === 'array') {
    if (isRequired && !Array.isArray(value)) return [`${label} is required.`];
    return [];
  }

  if (kind === 'title-value') {
    const actualValue = value?.value;
    const valueSchema = propDef.properties?.value;
    if (isRequired && isEmptyValue(actualValue)) return [`${label} is required.`];
    return isEmptyValue(actualValue) ? [] : validateScalarValue(actualValue, valueSchema, label);
  }

  if (kind === 'boolean') {
    if (isRequired && typeof value !== 'boolean') return [`${label} is required.`];
    return [];
  }

  if (isRequired && isEmptyValue(value)) return [`${label} is required.`];
  return isEmptyValue(value) ? [] : validateScalarValue(value, propDef, label, contextSchema);
}

function getFieldErrors(data, schema, contextSchema) {
  const errorsByField = {};
  const requiredSet = new Set(schema?.required ?? []);

  for (const [key, propDef] of Object.entries(schema?.properties ?? {})) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const label = propDef.title ?? propDef.properties?.title?.const ?? key;
    const fieldErrors = validateField(propDef, data?.[key], requiredSet.has(key), label, contextSchema);
    if (fieldErrors.length > 0) {
      errorsByField[key] = fieldErrors;
    }
  }

  return errorsByField;
}

function getFieldPathKey(path, key) {
  return [...path, key].join('.');
}

function getNavigationButtonClassName(isRoot) {
  return isRoot ? 'property-form-back-button property-form-back-button--disabled' : 'property-form-back-button';
}

/**
 * Inverse of normalizeFromDb. Walks the data against a schema and unwraps
 * { title, value } objects back to plain scalar values so the server's flat
 * Mongoose model continues to accept the payload without changes.
 */
function flattenForApi(data, schema, contextSchema) {
  if (!schema || !data || typeof data !== 'object') return data;
  const ctx = contextSchema ?? schema;
  const requiredSet = new Set(schema.required ?? []);
  const result = { ...data };
  for (const [key, propDef] of Object.entries(schema.properties ?? {})) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const val = data[key];
    if (val === undefined || val === null) continue;
    const kind = classifyField(key, propDef);
    if (kind === 'title-value') {
      const unwrapped = typeof val === 'object' && val.value !== undefined ? val.value : val;
      if (unwrapped === '' && !requiredSet.has(key)) {
        // Omit empty optional fields so the server can $unset them cleanly
        result[key] = null;
      } else {
        result[key] = unwrapped;
      }
    } else if (kind === 'array' && Array.isArray(val)) {
      const iSchema = resolveItemSchema(propDef, ctx);
      result[key] = iSchema
        ? val.map((item) => flattenForApi(item, iSchema, ctx))
        : val;
    }
  }
  return result;
}

/**
 * Coerce raw DB data to match the shape a schema expects.
 * - title-value fields stored as plain scalars get wrapped: "John" → { title: "First Name", value: "John" }
 * - array fields recurse into each item using the item schema
 * - system fields and already-correct shapes pass through unchanged
 */
function normalizeFromDb(data, schema, contextSchema) {
  if (!schema || !data || typeof data !== 'object') return data;
  const ctx = contextSchema ?? schema;
  const result = { ...data };
  for (const [key, propDef] of Object.entries(schema.properties ?? {})) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const raw = data[key];
    if (raw === undefined || raw === null) continue;
    const kind = classifyField(key, propDef);
    if (kind === 'title-value') {
      // Already correct shape
      if (typeof raw === 'object' && raw.title !== undefined && raw.value !== undefined) continue;
      // Flat scalar — wrap it
      result[key] = { title: propDef.properties.title.const, value: raw };
    } else if (kind === 'array' && Array.isArray(raw)) {
      const iSchema = resolveItemSchema(propDef, ctx);
      result[key] = iSchema
        ? raw.map((item) => normalizeFromDb(item, iSchema, ctx))
        : raw;
    }
  }
  return result;
}

// ─── Immutable path helpers ────────────────────────────────────────────────────

function getAtPath(obj, path) {
  return path.reduce((acc, key) => acc?.[key], obj);
}

function setAtPath(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head] = setAtPath(copy[head], tail, value);
    return copy;
  }
  const next = obj?.[head] ?? (typeof tail[0] === 'number' ? [] : {});
  return { ...obj, [head]: setAtPath(next, tail, value) };
}

// ─── SchemaField ──────────────────────────────────────────────────────────────

/**
 * Renders a single editable form field derived from a property schema definition.
 * Handles: boolean toggle, scalar enum (Select), scalar text/number (Input),
 * and the custom title-value pattern.
 */
function SchemaField({ fieldKey, propDef, value, onChange, onBlur, isRequired, errors = [] }) {
  const kind = classifyField(fieldKey, propDef);
  const hasError = errors.length > 0;
  const errorText = errors[0];

  // ── Boolean ────────────────────────────────────────────────────────────────
  if (kind === 'boolean') {
    return (
      <Form.Field required={isRequired} error={hasError}>
        <label>{propDef.title ?? fieldKey}</label>
        <Checkbox
          toggle
          label={value ? 'Yes' : 'No'}
          checked={!!value}
          onBlur={onBlur}
          onChange={(_, { checked }) => onChange(checked)}
        />
        {hasError && <div className="property-form-field-error">{errorText}</div>}
      </Form.Field>
    );
  }

  // ── Flat scalar ───────────────────────────────────────────────────────────
  if (kind === 'scalar') {
    const label = propDef.title ?? fieldKey;
    if (propDef.enum) {
      const opts = propDef.enum.map((v) => ({ key: String(v), text: String(v), value: v }));
      return (
        <Form.Field required={isRequired} error={hasError}>
          <label>{label}</label>
          <Select
            fluid
            options={opts}
            value={value ?? opts[0]?.value}
            onBlur={onBlur}
            onChange={(_, { value: v }) => onChange(v)}
            placeholder={`Select ${label}`}
          />
          {hasError && <div className="property-form-field-error">{errorText}</div>}
        </Form.Field>
      );
    }
    const isNum = propDef.type === 'integer' || propDef.type === 'number';
    return (
      <Form.Field required={isRequired} error={hasError}>
        <label>{label}</label>
        <Input
          fluid
          type={isNum ? 'number' : 'text'}
          value={value ?? ''}
          min={propDef.minimum}
          max={propDef.maximum}
          placeholder={label}
          error={hasError}
          onBlur={onBlur}
          onChange={(e) => onChange(isNum ? Number(e.target.value) : e.target.value)}
        />
        {hasError && <div className="property-form-field-error">{errorText}</div>}
      </Form.Field>
    );
  }

  // ── title-value object ────────────────────────────────────────────────────
  if (kind === 'title-value') {
    const label      = propDef.title ?? propDef.properties?.title?.const ?? fieldKey;
    const titleConst = propDef.properties.title.const;
    const valSchema  = propDef.properties.value;
    const currentVal = value?.value ?? defaultForSchema(valSchema);

    if (valSchema.enum) {
      const opts = valSchema.enum.map((v) => ({ key: String(v), text: String(v), value: v }));
      return (
        <Form.Field required={isRequired} error={hasError}>
          <label>{label}</label>
          <Select
            fluid
            options={opts}
            value={currentVal}
            onBlur={onBlur}
            onChange={(_, { value: v }) => onChange({ title: titleConst, value: v })}
            placeholder={`Select ${label}`}
          />
          {hasError && <div className="property-form-field-error">{errorText}</div>}
        </Form.Field>
      );
    }

    const isNum = valSchema.type === 'integer' || valSchema.type === 'number';
    return (
      <Form.Field required={isRequired} error={hasError}>
        <label>{label}</label>
        <Input
          fluid
          type={isNum ? 'number' : 'text'}
          value={currentVal}
          min={valSchema.minimum}
          max={valSchema.maximum}
          placeholder={label}
          error={hasError}
          onBlur={onBlur}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({ title: titleConst, value: isNum ? Number(raw) : raw });
          }}
        />
        {hasError && <div className="property-form-field-error">{errorText}</div>}
      </Form.Field>
    );
  }

  return null;
}

// ─── PropertyForm ─────────────────────────────────────────────────────────────

/**
 * Navigation stack entry:
 * {
 *   label           : string     – breadcrumb / header label
 *   schema          : object     – JSON schema for this level
 *   contextSchema   : object     – parent schema (for local $ref resolution)
 *   dataPath        : (string|number)[]  – path from rootData to this level
 *   isArray         : boolean    – true → render array manager; false → render object form
 *   isNew           : boolean    – true when this item was just added (discard = also delete)
 *   snapshotOnEnter : any        – deep copy of data when we navigated in (for dirty detection)
 *   promptOnBack    : boolean    – whether to show the unsaved-changes dialog on Back
 * }
 */
function PropertyForm({ selected, onSave, onCancel }) {
  const makeEmpty = () => buildEmpty(propertySchema);

  const rootEntry = (data) => ({
    label:           propertySchema.title ?? 'Property',
    schema:          propertySchema,
    contextSchema:   propertySchema,
    dataPath:        [],
    isArray:         false,
    isNew:           false,
    snapshotOnEnter: JSON.parse(JSON.stringify(data)),
    promptOnBack:    false,
  });

  const [rootData,    setRootData]    = useState(makeEmpty);
  const [navStack,    setNavStack]    = useState(() => { const d = makeEmpty(); return [rootEntry(d)]; });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Load selected record
  useEffect(() => {
    const raw     = selected ? { ...makeEmpty(), ...selected } : makeEmpty();
    const initial = selected ? normalizeFromDb(raw, propertySchema, propertySchema) : raw;
    setRootData(initial);
    setNavStack([rootEntry(initial)]);
    setTouchedFields({});
    setSubmitAttempted(false);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = navStack[navStack.length - 1];
  const isRoot  = navStack.length === 1;
  const currentData = getAtPath(rootData, current.dataPath);
  const validationErrors = validateDataAgainstSchema(rootData, propertySchema, propertySchema);
  const currentFieldErrors = current.isArray
    ? {}
    : getFieldErrors(currentData, current.schema, current.contextSchema);

  const isDirty = current.promptOnBack && current.snapshotOnEnter != null
    ? !deepEqual(currentData, current.snapshotOnEnter)
    : false;

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goBack = (keepChanges) => {
    if (!keepChanges) {
      if (current.isNew) {
        // Remove the newly-added item from its parent array entirely
        const parentPath = current.dataPath.slice(0, -1);
        const idx        = current.dataPath[current.dataPath.length - 1];
        setRootData((d) => {
          const arr = getAtPath(d, parentPath) ?? [];
          return setAtPath(d, parentPath, arr.filter((_, i) => i !== idx));
        });
      } else {
        // Revert to snapshot
        setRootData((d) => setAtPath(d, current.dataPath, current.snapshotOnEnter));
      }
    }
    setNavStack((s) => s.slice(0, -1));
  };

  const handleBack = () => {
    if (isRoot) return;
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      goBack(true);
    }
  };

  const handleConfirmKeep    = () => { setConfirmOpen(false); goBack(true);  };
  const handleConfirmDiscard = () => { setConfirmOpen(false); goBack(false); };
  const handleConfirmCancel  = () => setConfirmOpen(false);

  // Navigate into an array child property (from an object form)
  const handleNavigateIntoArray = (key, propDef) => {
    const nextPath = [...current.dataPath, key];
    const data     = getAtPath(rootData, nextPath) ?? [];
    // Keep context at the current schema document root so local $refs inside
    // items (e.g. #/$defs/phone inside address.schema.json) resolve correctly.
    const nextCtx  = current.schema?.$id ? current.schema : current.contextSchema;
    setNavStack((s) => [...s, {
      label:           propDef.title ?? key,
      schema:          propDef,
      contextSchema:   nextCtx,
      dataPath:        nextPath,
      isArray:         true,
      isNew:           false,
      snapshotOnEnter: JSON.parse(JSON.stringify(data)),
      promptOnBack:    true,
    }]);
  };

  // Navigate into a specific array item for editing
  const handleNavigateToItem = (index) => {
    const iSchema   = resolveItemSchema(current.schema, current.contextSchema);
    const nextPath  = [...current.dataPath, index];
    const itemData  = getAtPath(rootData, nextPath) ?? buildEmpty(iSchema);
    // If the item schema is a registry root (has $id), use it as its own context;
    // otherwise keep the parent context so local $refs still resolve.
    const nextCtx   = iSchema?.$id ? iSchema : current.contextSchema;
    setNavStack((s) => [...s, {
      label:           itemDisplayLabel(itemData, iSchema, index),
      schema:          iSchema,
      contextSchema:   nextCtx,
      dataPath:        nextPath,
      isArray:         false,
      isNew:           false,
      snapshotOnEnter: JSON.parse(JSON.stringify(itemData)),
      promptOnBack:    true,
    }]);
  };

  // Add a new item to the current array and navigate into it
  const handleAddItem = () => {
    const iSchema  = resolveItemSchema(current.schema, current.contextSchema);
    const newItem  = buildEmpty(iSchema);
    const arr      = getAtPath(rootData, current.dataPath) ?? [];
    const newIndex = arr.length;
    const nextCtx  = iSchema?.$id ? iSchema : current.contextSchema;
    setRootData((d) => setAtPath(d, current.dataPath, [...arr, newItem]));
    setNavStack((s) => [...s, {
      label:           `New ${iSchema?.title ?? 'Item'}`,
      schema:          iSchema,
      contextSchema:   nextCtx,
      dataPath:        [...current.dataPath, newIndex],
      isArray:         false,
      isNew:           true,
      snapshotOnEnter: JSON.parse(JSON.stringify(newItem)),
      promptOnBack:    true,
    }]);
  };

  const handleDeleteItem = (index) => {
    const arr = getAtPath(rootData, current.dataPath) ?? [];
    setRootData((d) => setAtPath(d, current.dataPath, arr.filter((_, i) => i !== index)));
  };

  // Field change at current object level
  const handleFieldChange = (key, value) => {
    setRootData((d) => setAtPath(d, [...current.dataPath, key], value));
  };

  const handleFieldBlur = (key) => {
    const pathKey = getFieldPathKey(current.dataPath, key);
    setTouchedFields((prev) => (prev[pathKey] ? prev : { ...prev, [pathKey]: true }));
  };

  const markCurrentFieldsTouched = () => {
    const nextTouched = {};
    for (const key of Object.keys(current.schema?.properties ?? {})) {
      if (SYSTEM_FIELDS.has(key)) continue;
      nextTouched[getFieldPathKey(current.dataPath, key)] = true;
    }
    setTouchedFields((prev) => ({ ...prev, ...nextTouched }));
  };

  // Global save — always saves the full rootData regardless of current nav level
  const handleGlobalSave = async () => {
    setSubmitAttempted(true);
    if (validationErrors.length > 0) {
      markCurrentFieldsTouched();
      return;
    }
    const empty   = makeEmpty();
    const payload = flattenForApi(rootData, propertySchema, propertySchema);
    await onSave(payload);
    setRootData(empty);
    setNavStack([rootEntry(empty)]);
    setTouchedFields({});
    setSubmitAttempted(false);
  };

  // Global cancel/clear — same action: reset and close
  const handleGlobalCancel = () => {
    const empty = makeEmpty();
    setRootData(empty);
    setNavStack([rootEntry(empty)]);
    setTouchedFields({});
    setSubmitAttempted(false);
    onCancel();
  };

  // ── Render: object form ────────────────────────────────────────────────────

  const renderObjectForm = () => {
    const props       = current.schema?.properties ?? {};
    const requiredSet = new Set(current.schema?.required ?? []);
    const fields      = [];
    const arrayNavs   = [];

    for (const [key, propDef] of Object.entries(props)) {
      const kind = classifyField(key, propDef);
      if (kind === 'system') continue;
      if (kind === 'array') arrayNavs.push({ key, propDef });
      else                  fields.push({ key, propDef });
    }

    return (
      <Form>
        {fields.map(({ key, propDef }) => (
          <SchemaField
            key={key}
            fieldKey={key}
            propDef={propDef}
            value={currentData?.[key]}
            onChange={(val) => handleFieldChange(key, val)}
            onBlur={() => handleFieldBlur(key)}
            isRequired={requiredSet.has(key)}
            errors={submitAttempted || touchedFields[getFieldPathKey(current.dataPath, key)] ? (currentFieldErrors[key] ?? []) : []}
          />
        ))}

        {arrayNavs.length > 0 && (
          <div className="property-form-array-nav-list">
            {arrayNavs.map(({ key, propDef }) => {
              const iSchema = resolveItemSchema(propDef, current.contextSchema);
              const label   = propDef.title ?? iSchema?.title ?? key;
              const count   = Array.isArray(currentData?.[key]) ? currentData[key].length : 0;
              return (
                <div
                  key={key}
                  className="property-form-array-nav"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavigateIntoArray(key, propDef)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigateIntoArray(key, propDef)}
                >
                  <span className="property-form-array-nav-label">{label}</span>
                  <span>
                    <Label circular size="small">{count}</Label>
                    <Icon name="chevron right" className="property-form-array-nav-icon" />
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </Form>
    );
  };

  // ── Render: array manager ──────────────────────────────────────────────────

  const renderArrayManager = () => {
    const iSchema = resolveItemSchema(current.schema, current.contextSchema);
    const arr     = Array.isArray(currentData) ? currentData : [];
    const addBtn  = (
      <Button primary size="small" icon labelPosition="left" onClick={handleAddItem} className="property-form-add-button">
        <Icon name="plus" />
        Add {iSchema?.title ?? 'Item'}
      </Button>
    );

    if (arr.length === 0) {
      return (
        <>
          <Message info content={`No ${current.label.toLowerCase()} yet.`} />
          {addBtn}
        </>
      );
    }

    return (
      <>
        <Table celled compact selectable>
          <Table.Body>
            {arr.map((item, i) => (
              <Table.Row
                key={i}
                className="property-form-array-row"
                onClick={() => handleNavigateToItem(i)}
              >
                <Table.Cell>
                  <strong>{itemDisplayLabel(item, iSchema, i)}</strong>
                  {item?.isDefault && (
                    <Label size="tiny" color="blue" className="property-form-default-label">Default</Label>
                  )}
                </Table.Cell>
                <Table.Cell collapsing onClick={(e) => e.stopPropagation()}>
                  <Button icon="pencil" size="tiny" basic title="Edit"   onClick={() => handleNavigateToItem(i)} />
                  <Button icon="trash"  size="tiny" basic color="red" title="Delete" onClick={() => handleDeleteItem(i)} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {addBtn}
      </>
    );
  };

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  const breadcrumb = navStack.map((n) => n.label).join(' › ');

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <Segment>
      {/* Navigation header */}
      <div className="property-form-header">
        <Button
          icon="arrow left"
          size="small"
          basic
          disabled={isRoot}
          title="Go back"
          onClick={handleBack}
          className={getNavigationButtonClassName(isRoot)}
        />
        <div>
          <Header as="h3" className="property-form-title">{current.label}</Header>
          {navStack.length > 1 && (
            <small className="property-form-breadcrumb">{breadcrumb}</small>
          )}
        </div>
      </div>

      {/* Content */}
      {current.isArray ? renderArrayManager() : renderObjectForm()}

      {/* Single global action footer */}
      <div className="property-form-footer">
        <Button primary onClick={handleGlobalSave}>
          {selected ? 'Update' : 'Create'}
        </Button>
        <Button onClick={handleGlobalCancel}>Cancel</Button>
      </div>

      {/* Unsaved-changes dialog (shown when pressing Back with dirty data) */}
      <Modal open={confirmOpen} size="small">
        <Modal.Header>Unsaved Changes</Modal.Header>
        <Modal.Content>
          This level has unsaved changes. Do you want to keep or discard them?
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={handleConfirmCancel}>Stay</Button>
          <Button color="red"  onClick={handleConfirmDiscard}>Discard Changes</Button>
          <Button color="blue" onClick={handleConfirmKeep}>Keep Changes</Button>
        </Modal.Actions>
      </Modal>
    </Segment>
  );
}

export default PropertyForm;


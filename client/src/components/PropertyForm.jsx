import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

function enforceSingleDefault(items, selectedIndex) {
  return items.map((item, index) => ({
    ...item,
    isDefault: index === selectedIndex,
  }));
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
    const label = fieldKey === 'isDefault' ? 'Default' : (propDef.title ?? fieldKey);
    return (
      <Box>
        <FormControlLabel
          control={(
            <Switch
            checked={!!value}
            onBlur={onBlur}
            onChange={(e) => onChange(e.target.checked)}
            />
          )}
          label={label}
          sx={{ alignItems: 'center', m: 0 }}
        />
        {hasError && <Typography variant="caption" color="error">{errorText}</Typography>}
      </Box>
    );
  }

  // ── Flat scalar ───────────────────────────────────────────────────────────
  if (kind === 'scalar') {
    const label = propDef.title ?? fieldKey;
    if (propDef.enum) {
      const currentValue = value ?? propDef.enum[0] ?? '';
      return (
        <TextField
          select
          fullWidth
          label={label}
          value={currentValue}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          error={hasError}
          helperText={errorText || ' '}
          required={isRequired}
        >
          {propDef.enum.map((enumValue) => (
            <MenuItem key={String(enumValue)} value={enumValue}>{String(enumValue)}</MenuItem>
          ))}
        </TextField>
      );
    }
    const isNum = propDef.type === 'integer' || propDef.type === 'number';
    return (
      <TextField
        fullWidth
        label={label}
        type={isNum ? 'number' : 'text'}
        value={value ?? ''}
        placeholder={label}
        slotProps={{ htmlInput: { min: propDef.minimum, max: propDef.maximum } }}
        onBlur={onBlur}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(isNum ? (raw === '' ? '' : Number(raw)) : raw);
        }}
        error={hasError}
        helperText={errorText || ' '}
        required={isRequired}
      />
    );
  }

  // ── title-value object ────────────────────────────────────────────────────
  if (kind === 'title-value') {
    const label      = propDef.title ?? propDef.properties?.title?.const ?? fieldKey;
    const titleConst = propDef.properties.title.const;
    const valSchema  = propDef.properties.value;
    const currentVal = value?.value ?? defaultForSchema(valSchema);

    if (valSchema.enum) {
      const currentValue = currentVal ?? valSchema.enum[0] ?? '';
      return (
        <TextField
          select
          fullWidth
          label={label}
          value={currentValue}
          onBlur={onBlur}
          onChange={(e) => onChange({ title: titleConst, value: e.target.value })}
          error={hasError}
          helperText={errorText || ' '}
          required={isRequired}
        >
          {valSchema.enum.map((enumValue) => (
            <MenuItem key={String(enumValue)} value={enumValue}>{String(enumValue)}</MenuItem>
          ))}
        </TextField>
      );
    }

    const isNum = valSchema.type === 'integer' || valSchema.type === 'number';
    return (
      <TextField
        fullWidth
        label={label}
        type={isNum ? 'number' : 'text'}
        value={currentVal}
        placeholder={label}
        slotProps={{ htmlInput: { min: valSchema.minimum, max: valSchema.maximum } }}
        onBlur={onBlur}
        onChange={(e) => {
          const raw = e.target.value;
          onChange({ title: titleConst, value: isNum ? (raw === '' ? '' : Number(raw)) : raw });
        }}
        error={hasError}
        helperText={errorText || ' '}
        required={isRequired}
      />
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
  const previousSelectedIdRef = useRef(selected?.id ?? null);

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
    const nextSelectedId = selected?.id ?? null;
    const shouldResetNavigation = previousSelectedIdRef.current !== nextSelectedId;

    setRootData(initial);
    setNavStack((prev) => {
      if (shouldResetNavigation || prev.length === 0) {
        return [rootEntry(initial)];
      }

      return prev.map((entry) => ({
        ...entry,
        snapshotOnEnter: JSON.parse(JSON.stringify(getAtPath(initial, entry.dataPath))),
      }));
    });
    setTouchedFields({});
    setSubmitAttempted(false);
    previousSelectedIdRef.current = nextSelectedId;
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
    if (isRoot) {
      onCancel();
      return;
    }
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
    setRootData((d) => {
      if (key === 'isDefault' && value === true && typeof current.dataPath[current.dataPath.length - 1] === 'number') {
        const itemIndex = current.dataPath[current.dataPath.length - 1];
        const parentPath = current.dataPath.slice(0, -1);
        const siblings = getAtPath(d, parentPath) ?? [];
        return setAtPath(d, parentPath, enforceSingleDefault(siblings, itemIndex));
      }

      return setAtPath(d, [...current.dataPath, key], value);
    });
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
    const payload = flattenForApi(rootData, propertySchema, propertySchema);
    await onSave(payload);
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
      <Stack component="form" spacing={1} onSubmit={(e) => e.preventDefault()}>
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
          <Stack spacing={1} sx={{ mt: 1 }}>
            {arrayNavs.map(({ key, propDef }) => {
              const iSchema = resolveItemSchema(propDef, current.contextSchema);
              const label   = propDef.title ?? iSchema?.title ?? key;
              const count   = Array.isArray(currentData?.[key]) ? currentData[key].length : 0;
              return (
                <Paper
                  key={key}
                  variant="outlined"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavigateIntoArray(key, propDef)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigateIntoArray(key, propDef)}
                  sx={{
                    alignItems: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                  }}
                >
                  <Typography fontWeight={600}>{label}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip label={count} size="small" />
                    <Typography variant="body2" color="text.secondary">&gt;</Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

      </Stack>
    );
  };

  // ── Render: array manager ──────────────────────────────────────────────────

  const renderArrayManager = () => {
    const iSchema = resolveItemSchema(current.schema, current.contextSchema);
    const arr     = Array.isArray(currentData) ? currentData : [];
    const addBtn  = (
      <Button type="button" variant="contained" size="small" onClick={handleAddItem}>
        Add {iSchema?.title ?? 'Item'}
      </Button>
    );

    if (arr.length === 0) {
      return (
        <>
          <Alert severity="info">No {current.label.toLowerCase()} yet.</Alert>
          {addBtn}
        </>
      );
    }

    return (
      <Stack spacing={2}>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableBody>
            {arr.map((item, i) => (
              <TableRow
                hover
                key={i}
                onClick={() => handleNavigateToItem(i)}
              >
                <TableCell>
                  <strong>{itemDisplayLabel(item, iSchema, i)}</strong>
                  {item?.isDefault && (
                    <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Button type="button" size="small" onClick={() => handleNavigateToItem(i)}>
                    Edit
                  </Button>
                  <Button type="button" color="error" size="small" onClick={() => handleDeleteItem(i)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
        {addBtn}
      </Stack>
    );
  };

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  const breadcrumb = navStack.map((n) => n.label).join(' › ');

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {/* Navigation header */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton
          aria-label="Go back"
          onClick={handleBack}
          size="small"
          color="primary"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6">{current.label}</Typography>
          {navStack.length > 1 && (
            <Typography variant="body2" color="text.secondary">{breadcrumb}</Typography>
          )}
        </Box>
      </Stack>

      {/* Content */}
      {current.isArray ? renderArrayManager() : renderObjectForm()}

      {/* Single global action footer */}
      <Stack direction="row" spacing={2} sx={{ borderTop: 1, borderColor: 'divider', mt: 3, pt: 2 }}>
        <Button type="button" variant="contained" onClick={handleGlobalSave}>
          {selected ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="outlined" onClick={handleGlobalCancel}>Cancel</Button>
      </Stack>

      {/* Unsaved-changes dialog (shown when pressing Back with dirty data) */}
      <Dialog open={confirmOpen} maxWidth="sm" fullWidth>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          This level has unsaved changes. Do you want to keep or discard them?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmCancel}>Stay</Button>
          <Button color="error" onClick={handleConfirmDiscard}>Discard Changes</Button>
          <Button variant="contained" onClick={handleConfirmKeep}>Keep Changes</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default PropertyForm;


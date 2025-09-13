import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import schema from './diagram.schema.json' with { type: 'json' };

// Ajv 2020 instance to support draft 2020-12 meta-schema referenced in diagram.schema.json
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
try { addFormats(ajv); } catch { /* formats optional */ }

let validateFn = ajv.compile(schema);

export function validateDiagram(doc: unknown) {
  try {
    const valid = validateFn(doc);
    return { valid, errors: validateFn.errors ?? [] };
  } catch (e: any) {
    return { valid: false, errors: [{ message: e?.message || 'Validation threw' }] };
  }
}

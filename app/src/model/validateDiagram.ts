import AjvModule from 'ajv';
import schema from './diagram.schema.json' with { type: 'json' };

// Work around Ajv's type export shape under NodeNext by referencing the default export value.
const AjvCtor: any = AjvModule as any;
const ajv = new AjvCtor({ allErrors: true, allowUnionTypes: true });
const validateFn = ajv.compile(schema);

export function validateDiagram(doc: unknown) {
  const valid = validateFn(doc);
  return { valid, errors: validateFn.errors ?? [] };
}

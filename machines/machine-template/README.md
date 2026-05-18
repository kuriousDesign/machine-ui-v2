# Machine Template

Use this folder as the template for real machine-specific override surfaces.

Expected contents:

- feature configuration
- operation-screen composition
- machine-specific form logic
- custom device button registries

The machine entrypoint should be `registry.ts`.

That registry declares:

- screens/components
- forms
- action wrappers
- bridge-type adapters
- custom device button groups
import brochure from './brochure'
import page from './page'
import { sectionSchemas } from './sections'

/**
 * All schemas registered with Sanity.
 * Import this into sanity.config.ts:
 *
 *   import { schemaTypes } from './schemas'
 *   export default defineConfig({
 *     schema: { types: schemaTypes },
 *     ...
 *   })
 */
export const schemaTypes = [brochure, page, ...sectionSchemas]

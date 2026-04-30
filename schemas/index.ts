import brochure from './brochure'
import company from './company'
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
export const schemaTypes = [brochure, company, page, ...sectionSchemas]

import type { Section } from '@/types/brochure'
import { nanokey } from './nanokey'

/**
 * Factory functions that return a new section of each type with default content.
 * Ported 1:1 from the builder's PAGE_TYPES[type].defaults() factories so that
 * a freshly-added section in the new editor looks identical to one added in
 * the HTML prototype.
 *
 * Each factory generates a fresh _key so React can track the new item
 * immediately; Sanity will preserve this key on save.
 */
export function sectionDefaults(type: Section['_type']): Section {
  const _key = nanokey()
  switch (type) {
    case 'cover':
    case 'coverCentered':
      return {
        _key,
        _type: type,
        edition: '2026 Edition',
        brandMark: 'GPGT · Hospitality',
        sup: 'Formula 1',
        title: 'Monaco',
        titleAccent: 'Grand Prix',
        tag: 'Three days of glamour, adrenaline, and access in the principality',
        cta: 'Take your seat',
        ref: 'No. 001 / Volume XV',
      }

    case 'intro':
      return {
        _key,
        _type: 'intro',
        letter: 'A',
        eyebrow: 'GPGT · Monaco',
        title: 'Feel the rhythm of Monte Carlo',
        body: 'Monaco is the jewel of the Formula 1 calendar. The principality transforms for one weekend in May, its streets becoming the most demanding circuit in motorsport. From your terrace above the harbour, every yacht, every driver, every echo of a V6 turbo hybrid is part of the show. This is the race weekend you have been waiting for.',
        caption: 'Monte Carlo, May 2026',
      }

    case 'contentImage':
      return {
        _key,
        _type: 'contentImage',
        eyebrow: 'The experience',
        title: 'Crafted for enthusiasts',
        body: "Every trip is built around one idea: giving motorsport fans the closest view of the action, with the comforts of a fully managed tour. From trackside hospitality to behind-the-scenes access, we handle every detail so you can focus on the weekend.",
      }

    case 'imageContent':
      return {
        _key,
        _type: 'imageContent',
        eyebrow: 'Our approach',
        title: 'Where the race meets the ritual',
        body: "A Grand Prix weekend is more than a race. It's a stage, a ceremony, a city turned over to the sport. We build each itinerary to honour that — grandstand seats, insider briefings, and the paddock moments that change how you watch forever.",
      }

    case 'sectionHeading':
    case 'sectionHeadingCentered':
      return {
        _key,
        _type: type,
        eyebrow: 'A weekend of',
        title: 'Hospitality',
        text: '',
      }

    case 'features':
      return {
        _key,
        _type: 'features',
        title: 'A weekend of',
        titleAccent: 'speed',
        subtitle: 'Every package is crafted around three pillars — what you see, what you do, and what you taste.',
        cards: [
          { _key: nanokey(), title: 'The Views', text: 'Panoramic rooftop terraces above the circuit. Drivers negotiate the harbour chicane beneath your feet, in perfect view.' },
          { _key: nanokey(), title: 'The Experience', text: 'Private pit lane walks, grid tours with our expert hosts, and photo safaris inside the garages.' },
          { _key: nanokey(), title: 'The Flavours', text: 'A culinary programme curated by Michelin-starred chefs. Open bar, canapés, and a long, celebratory lunch.' },
        ],
      }

    case 'imageHero':
      return {
        _key,
        _type: 'imageHero',
        eyebrow: 'The Circuit',
        title: 'Circuit de Monaco',
        text: '3.337 km of street circuit through Monte Carlo — the tightest, most unforgiving track in Formula 1. Where qualifying decides everything and barriers sit inches from carbon fibre.',
      } as Section

    case 'stats':
      return {
        _key,
        _type: 'stats',
        eyebrow: 'The Circuit',
        title: 'By the numbers',
        stats: [
          { _key: nanokey(), value: '3.337', unit: 'KM', label: 'Circuit Length' },
          { _key: nanokey(), value: '78', unit: '', label: 'Race Laps' },
          { _key: nanokey(), value: '19', unit: '', label: 'Corners' },
          { _key: nanokey(), value: '290', unit: 'KM/H', label: 'Top Speed' },
        ],
      }

    case 'packages':
      return {
        _key,
        _type: 'packages',
        title: 'Hospitality packages',
        packages: [
          { _key: nanokey(), tier: 'Essential', name: 'Grandstand', price: '8,950', currency: '£', from: 'From · per person', featured: false, features: ['3-day grandstand access', '4 nights 4★ accommodation', 'Breakfast daily', 'All airport transfers'] },
          { _key: nanokey(), tier: 'Popular', name: 'Paddock Club', price: '14,500', currency: '£', from: 'From · per person', featured: true, features: ['F1 Paddock Club pass', '5★ Monte Carlo hotel', 'Gourmet dining & open bar', 'Pit lane walk', 'Driver autograph session'] },
          { _key: nanokey(), tier: 'Exclusive', name: 'Yacht', price: '22,000', currency: '£', from: 'From · per person', featured: false, features: ['Private yacht berth', 'Panoramic race viewing', 'Michelin-level catering', 'Helicopter from Nice'] },
        ],
      }

    case 'itinerary':
      return {
        _key,
        _type: 'itinerary',
        title: 'The itinerary',
        days: [
          { _key: nanokey(), day: '01', label: 'Thursday', title: 'Arrival & welcome', description: 'Private transfer from Nice Airport. Evening welcome reception overlooking the harbour.' },
          { _key: nanokey(), day: '02', label: 'Friday', title: 'Free practice & pit walk', description: 'Morning sessions from your Paddock Club suite. Afternoon pit lane walk with our team.' },
          { _key: nanokey(), day: '03', label: 'Saturday', title: 'Qualifying', description: 'Full track access. Qualifying is where Monaco is won. Evening yacht party.' },
          { _key: nanokey(), day: '04', label: 'Sunday', title: 'Race day', description: 'Champagne lunch before lights out. Post-race celebration, then departure.' },
        ],
      }

    case 'galleryEditorial':
      return { _key, _type: 'galleryEditorial', title: 'Moments', images: [] }

    case 'galleryGrid':
      return { _key, _type: 'galleryGrid', eyebrow: 'Moments', title: 'From the paddock', images: [] }

    case 'galleryDuo':
      return { _key, _type: 'galleryDuo', eyebrow: 'Two sides of the weekend', title: 'Track & terrace', images: [], captions: ['', ''] }

    case 'galleryHero':
      return { _key, _type: 'galleryHero', eyebrow: 'In focus', title: 'The moment that defined the weekend', caption: '', images: [] }

    case 'quoteProfile':
      return {
        _key,
        _type: 'quoteProfile',
        eyebrow: 'A word from',
        name: 'Gordon Ramsay',
        quote: 'I am so excited to introduce this experience. Breathtaking views, premium hospitality, and an atmosphere charged with the adrenaline of race weekend — this is the ultimate Grand Prix celebration.',
        body: 'A fusion of world-class cuisine, style, and high-octane excitement. Fresh local ingredients and vibrant seasonal produce bring the bold flavours of the Riviera to life, with signature cocktails and Asian-inspired cuisine to the streets of Monaco.',
      }

    case 'closing':
      return {
        _key,
        _type: 'closing',
        eyebrow: 'Reserve your place',
        title: 'Take your seat',
        subtitle: 'Limited packages available for the 2026 season. Our team will reach out within 24 hours.',
        ctaText: 'Enquire Now',
        ctaHref: '#enquire',
        email: 'hospitality@grandprixgrandtours.com',
        phone: '+44 20 1234 5678',
      }

    case 'spotlight':
      return {
        _key,
        _type: 'spotlight',
        eyebrow: 'In focus',
        title: 'A stage built around the weekend',
        body: 'The background sets the scene while the framed image holds the moment. Use this layout when you want an editorial feel — a portrait of a place, a person, or a single hero shot — without losing space for the story beside it.',
        caption: 'Monte Carlo, May 2026',
      }

    case 'textCenter':
      return {
        _key,
        _type: 'textCenter',
        eyebrow: 'A note',
        title: 'Built for the weekend',
        body: 'A short, centered paragraph to give readers a pause between the headline sections. Use it for a transition moment — a reflection, an aside, or a short editorial note.',
      }

    case 'footer':
      return {
        _key,
        _type: 'footer',
        legal: '© 2026 Grand Prix Grand Tours · Registered in England No. 12345678',
        email: 'hospitality@grandprixgrandtours.com',
        phone: '+44 20 1234 5678',
        socials: [
          { _key: nanokey(), platform: 'instagram', href: 'https://instagram.com/grandprixgrandtours' },
          { _key: nanokey(), platform: 'x', href: 'https://x.com/gpgrandtours' },
          { _key: nanokey(), platform: 'linkedin', href: 'https://linkedin.com/company/grandprixgrandtours' },
        ],
      }

    case 'circuitMap':
      return {
        _key,
        _type: 'circuitMap',
        eyebrow: 'The circuit',
        title: 'Circuit de Monaco',
        caption: '3.337 km street circuit through Monte Carlo — the tightest, most unforgiving track on the Formula 1 calendar.',
        svg: '',
        stats: [
          { _key: nanokey(), value: '3.337', unit: 'KM', label: 'Length' },
          { _key: nanokey(), value: '19', unit: '', label: 'Turns' },
          { _key: nanokey(), value: '78', unit: '', label: 'Race laps' },
        ],
      }
  }
}

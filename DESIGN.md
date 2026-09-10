# Ahloul Khidmah — Design system (incumbent)

## Brand
- **Primary:** emerald deep `#0B3A25` / mid `#12512F`
- **Accent:** gold `#C9A24C` / light `#E8CE83`
- **Surface:** ivory `#FBF6EA`
- **Ink:** `#20241C` / soft `#4B4A3E`
- CSS vars: `--ak-*` in `src/app/globals.css` and `landing.css`

## Typography
- Display / titles: **Amiri** (`--font-amiri`)
- Body / UI: **Cairo** (`--font-cairo`)
- Avoid Inter, Arial-as-brand, purple gradients, nested card stacks

## Surfaces
- Public landing: one conversion block (Adhésion | Contribuer tabs), then short proof (Pourquoi, Mission, Témoignages, FAQ)
- Forms in compact mode: flat sections (dividers), not cards-in-cards
- Shadows: one subtle border preferred over multi-layer shadows

## Motion
- Logo spin / glow on hero; quieter on mobile; respect `prefers-reduced-motion`
- SoftPay redirects: immediate after method choice

## Anti-patterns (local)
- Creating adherent before payment
- Duplicate “Deux chemins” cards when tabs already exist
- Double “Payer en ligne” headers on SoftPay step

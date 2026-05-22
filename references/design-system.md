/**
 * InvoiceGen Design System
 * Single source of truth for all UI — dark theme, emerald accent
 *
 * HOW TO USE:
 * - All colors: use CSS vars from :root (see below)
 * - All spacing: use pixel values from scale (below)
 * - All border radius: use radius values (below)
 * - All typography: use font size + weight from scale
 * - Components: see examples below for card, stat, badge, table, button patterns
 *
 * COLOR PALETTE
 *   Background:  #09090B (primary), #0f0f10 (card bg), #181818 (hover)
 *   Border:      rgba(255,255,255,0.07) (default), rgba(255,255,255,0.12) (hover)
 *   Text:        #fff (primary), #a1a1aa (secondary), #52525b (muted/label)
 *   Accent:      #10b981 (emerald-500), #10b981/12 (bg tint), #10b981/20 (border tint)
 *   Status:      paid=#34d399, sent=#60a5fa, draft=#71717a, overdue=#f87171, cancelled=#52525b
 *   Danger:     #ef4444 bg=#ef4444/12 text=#ef4444
 *
 * SPACING SCALE (px)
 *   4  = xs gap
 *   8  = sm gap / padding
 *   12 = card inner padding
 *   16 = section gap / md padding
 *   20 = card padding
 *   24 = section padding
 *   32 = page margin
 *
 * BORDER RADIUS
 *   6px  = small (badges, chips)
 *   10px = medium (buttons, inputs)
 *   14px = large (cards, modals)
 *   20px = xl (panels, large containers)
 *
 * LAYOUT
 *   Sidebar: 224px wide, #09090B bg, 1px right border rgba(255,255,255,0.07)
 *   Topbar:  64px tall, same bg, blur backdrop
 *   Content: px-8 py-6, max-width none (full width dashboard)
 *   Cards:   bg #0f0f10, border rgba(255,255,255,0.07), radius 14px
 *
 * TYPOGRAPHY
 *   Page title:  24px/700/letter=-0.03em, color #fff
 *   Section head: 13px/600, color #a1a1aa
 *   Label:       10px/700, letter=0.12em, uppercase, color #52525b
 *   Stat value:  28px/700, letter=-0.03em, color #fff
 *   Body:        13px/400, color #a1a1aa
 *   Small:       12px/400, color #52525b
 *   Micro:       11px/600, badges
 */

/* ─── CSS Variables ─────────────────────────────────────────────────────────── */
:root {
  --bg-primary:    #09090B;
  --bg-card:      #0f0f10;
  --bg-hover:     #181818;
  --border:       rgba(255,255,255,0.07);
  --border-hover: rgba(255,255,255,0.12);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted:  #52525b;
  --accent:       #10b981;
  --accent-dim:   rgba(16,185,129,0.12);
  --accent-border: rgba(16,185,129,0.25);
  --paid:   #34d399;
  --sent:   #60a5fa;
  --draft:  #71717a;
  --overdue:#f87171;
  --danger: #ef4444;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}

/* ─── Component Examples ────────────────────────────────────────────────────── */

/* CARD
   <div style={{
     background: '#0f0f10',
     border: '1px solid rgba(255,255,255,0.07)',
     borderRadius: '14px',
     padding: '20px',
   }}>
*/

/* STAT CARD
   <div style={{
     background: '#0f0f10',
     border: '1px solid rgba(255,255,255,0.07)',
     borderRadius: '14px',
     padding: '20px',
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'space-between',
     minHeight: '112px',
   }}>
     <div>
       <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#52525b', margin: '0 0 10px' }}>
         LABEL
       </p>
       <p style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
         VALUE
       </p>
     </div>
     <p style={{ fontSize: '12px', color: '#52525b', margin: '6px 0 0' }}>SUB TEXT</p>
   </div>
*/

/* STATUS BADGE
   const colorMap = { paid: '#34d399', sent: '#60a5fa', draft: '#71717a', overdue: '#f87171' }
   <span style={{
     display: 'inline-flex', alignItems: 'center', gap: '5px',
     padding: '3px 10px', borderRadius: '100px',
     fontSize: '11px', fontWeight: 600,
     background: `${colorMap[status]}20`, color: colorMap[status],
   }}>
     <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colorMap[status] }} />
     LABEL
   </span>
*/

/* SECTION HEADER
   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
     <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: 0 }}>SECTION NAME</h2>
     <Link style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
   </div>
*/

/* DATA TABLE ROW
   <div style={{
     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
     padding: '12px 0',
     borderBottom: '1px solid rgba(255,255,255,0.04)',
   }}>
     <div style={{ flex: 1 }}>
       <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff', margin: '0 0 2px' }}>Primary</p>
       <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>Secondary</p>
     </div>
     <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Value</span>
   </div>
*/

/* ACCENT BUTTON
   <button style={{
     padding: '8px 16px',
     background: '#10b981', color: '#000',
     borderRadius: '10px', border: 'none',
     fontSize: '13px', fontWeight: 600,
     cursor: 'pointer',
   }}>LABEL</button>

/* GHOST BUTTON
   <button style={{
     padding: '8px 16px',
     background: 'rgba(255,255,255,0.05)', color: '#a1a1aa',
     borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
     fontSize: '13px', fontWeight: 500,
     cursor: 'pointer',
   }}>LABEL</button>
*/
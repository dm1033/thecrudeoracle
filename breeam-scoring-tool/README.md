# BREEAM Construction Project Scoring Tool (`temporaryworksconsulting.com`)

Online BREEAM UK Construction Project Scoring Tool & Pre-Assessment Calculator built for **Temporary Works Consulting & Design Ltd** (`https://www.temporaryworksconsulting.com`).

## Key Capabilities

1. **5 BREEAM Weighting Profiles**:
   - **BREEAM UK New Construction — Fully Fitted**
   - **BREEAM UK New Construction — Shell & Core**
   - **BREEAM UK New Construction — Shell Only**
   - **BREEAM UK Refurbishment & Fit-Out (Parts 1–4)**
   - **Civil & Heavy Temporary Works / Enabling Package**
2. **All 10 Environmental Sections & 43 BREEAM Issues**:
   - Management (`Man 01`–`Man 05`), Health & Wellbeing (`Hea 01`–`Hea 07`), Energy (`Ene 01`–`Ene 06`), Transport (`Tra 01`–`Tra 02`), Water (`Wat 01`–`Wat 04`), Materials (`Mat 01`–`Mat 06`), Waste (`Wst 01`–`Wst 06`), Land Use & Ecology (`LE 01`–`LE 05`), Pollution (`Pol 01`–`Pol 05`), and Innovation (`Inn 01` +10% additive bonus).
3. **Mandatory Minimum Standards & UKTR Timber Gate Enforcement**:
   - Automatically verifies mandatory credit & prerequisite gates for **Pass (≥30%)**, **Good (≥45%)**, **Very Good (≥55%)**, **Excellent (≥70%)**, and **Outstanding (≥85%)**, including the mandatory UKTR Legal & Sustainable Timber prerequisite across temporary works (`Mat 03` / `Man 03`).
   - Includes one-click **Auto-Fix Mandatory Minimum Standards** to resolve certification blockers.
4. **3 Dedicated Site & Temporary Works Sub-Calculators**:
   - **Man 03 Responsible Construction Practices**: CCS score, ISO 14001 EMS, BREEAM Sustainability Champion, and site utility/transport logs.
   - **Wst 01 & Wst 02 Construction Waste & Working Platforms**: Tonnes per 100 m² GIA benchmark, landfill diversion %, pre-demolition audit, and WRAP recycled aggregate reuse in **BR 470** piling mats and crane platforms.
   - **Mat 03 Responsible Sourcing & Site Timber Gate**: Temporary works timber Chain-of-Custody verification and RSCS point percentage calculator.
5. **Export, Share & Print**:
   - Auto-saves in `localStorage`, generates shareable URL state (`?breeam=...`), exports full CSV schedules, prints A4 PDF reports, and links directly to David J. Miller MSc CEng MICE via WhatsApp and Email.

## Commands

```bash
npm test        # Run automated BREEAM scoring engine & integration tests
npm run build   # Build static deployment bundle into dist/ and dist/breeam-scoring-tool/
```

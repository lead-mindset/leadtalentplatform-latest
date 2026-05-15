# LEAD Operating Team and Platform Access Reference

Last updated: 2026-05-10

## Purpose

This document records the current operating team reference for LEAD and clarifies how it should inform LEAD Talent Platform access decisions.

The main rule is:

> Chapter leadership data should not be treated as platform admin data.

Chapter presidents, vice presidents, directors, and e-board members may need chapter-level access, but they are not automatically platform admins. Platform admin or staff access should be reserved for the executive, directional, and operational team members explicitly listed below.

## Platform Access Principle

For imports and onboarding:

- Chapter executive board CSVs should create or update `person_profile` and `chapter_membership`.
- Chapter leaders may receive `chapter_membership.position` values such as `president`, `vice_president`, `treasurer`, `secretary`, `events_lead`, `marketing_lead`, `editor`, or `member`.
- Only people who need chapter dashboard permissions should receive app role `editor`.
- Real organization-level admins/staff should be managed separately from chapter CSV imports.
- Microsoft tenant membership or licensing status does not automatically determine app admin access.

## Executive Leadership

| Name | Organization Role | Platform Access Guidance |
| --- | --- | --- |
| Luis Coronel | CEO | Admin / founder identity |
| Antonny P. | COO & Strategy | Admin / staff identity |
| Nicole Jimenez | VP Operations | Admin / staff identity |

## Directions and Departments

| Name | Organization Role | Platform Access Guidance |
| --- | --- | --- |
| Abigail Briones | Director of Digital Transformation | Admin / staff identity |
| Jhoei Cisneros | Director of Events | Staff or admin depending on operational need |
| Christopher L. | Country Director - Peru | Staff or admin depending on operational need |
| Angela Cortes | Director of International Experience | Staff or admin depending on operational need |
| Kiara Aguirre | Director of Communications | Staff or admin depending on operational need |
| Cristhy T. | Director of Legal and Compliance | Staff or admin depending on operational need |
| Ariana Cassina | Director of Marketing | Staff or admin depending on operational need |
| Arianna Yauri | Director of PM | Staff or admin depending on operational need |
| Xiomara L. | Director of People | Staff or admin depending on operational need |

## Operating Team

| Name | Organization Role | Platform Access Guidance |
| --- | --- | --- |
| Keily Luna | Marketing | Staff identity if needed |
| Nikole A. | PM | Staff identity if needed |

## Microsoft Tenant Reference

This section records the Microsoft tenant/account reference provided for operational alignment. It should be treated as a directory reference, not as a direct import rule for platform permissions.

| Initials | Display Name / Account | Email / Tenant Identifier | License Notes |
| --- | --- | --- | --- |
| AB | Abigail Briones | abriones@leadmindset.org | Microsoft Power Apps for Developer, Microsoft Power Automate Free, Microsoft 365 Business Standard |
| A | amcp.engineer | amcp.engineer_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| AC | Angela Cortes | acortes@leadmindset.org | Microsoft Power Automate Free, Microsoft 365 Business Standard |
| AP | Antonny Porlles | aporlles@leadmindset.org | Microsoft 365 Business Standard |
| AC | Ariana Cassina | acassina@leadmindset.org | Microsoft Power Automate Free, Microsoft 365 Business Standard |
| AY | Arianna Yauri | ayauri@leadmindset.org | Microsoft Power Automate Free, Microsoft 365 Business Standard |
| B | brigitte.ruizr | brigitte.ruizr_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| C | caballeroespinozaceleste | caballeroespinozaceleste_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| C | carazasrubio022 | carazasrubio022_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| C | ccusi | ccusi_pronied.gob.pe#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| C | chrisest1414 | chrisest1414_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| CC | Christian Cusi | chriscusi@leadmindset.org | Microsoft 365 Business Standard |
| CL | Christopher Lozada | clozada@leadmindset.org | Microsoft 365 Business Standard |
| C | christopherlozada2005 | christopherlozada2005_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| CT | Cristhy Tantalean | ctantalean@leadmindset.org | Microsoft 365 Business Standard |
| F | fabianseverino100 | fabianseverino100_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| JC | Jhoel Cisneros | jcisneros@leadmindset.org | Microsoft Fabric (Free), Microsoft 365 Business Standard |
| J | john.chica | john.chica_uniminuto.edu#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| J | Joselin Brigitte Rodriguez Ruiz | n00326184_upn.pe#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| KL | Keily Luna | keiluna@leadmindset.org | Unlicensed |
| KA | Kiara Aguirre | kiaguirre@leadmindset.org | Microsoft 365 Business Standard |
| LC | Luis Coronel | luis.coronel@leadmindset.org | Microsoft Power Automate Free, Microsoft 365 Business Standard |
| NJ | Nicole Jimenez | operations@leadmindset.org | Microsoft 365 Business Standard |
| NA | Nikole Alvarado | nialvarado@leadmindset.org | Microsoft 365 Business Standard |
| P | peruviansinstem | peruviansinstem_gmail.com#EXT#@leadmindset.onmicrosoft.com | Unlicensed |
| XL | Xiomara Landa | xiolanda@leadmindset.org | Microsoft 365 Business Standard |

## Import Implications

When importing chapter executive board CSV data:

1. Do not grant `admin` to chapter leaders.
2. Default imported chapter leaders to app role `member` unless they need chapter dashboard access.
3. Use `chapter_membership.position` to represent their chapter position.
4. Use `lead_identity.identity_type='chapter_editor'` only for approved members with chapter-level leadership/editor responsibility.
5. Use `lead_identity.identity_type='staff'` or `founder` only for the organization-level team listed in this reference.
6. Keep recruiter/company visibility disabled by default unless the member explicitly opts in.


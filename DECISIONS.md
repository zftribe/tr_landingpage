# Integration decisions and open questions

## Established direction

- Welcome remains the public storefront and discovery site.
- LMS is the account/profile and learning hub, with distinct member and staff
  authorization. Product/checkout linking must use the LMS's verified catalogue.
- Review branches and previews come before production publication. Preserve current
  URLs and existing customer rights during any eventual migration.
- Store credentials in approved deployment/credential systems. Repository docs list
  configuration names and responsibilities, never confidential values.

## Pending before changing the storefront

| Question | Required evidence / owner decision |
|---|---|
| Prices and Base/MAX inclusions | Reconcile program cards, FAQ, shop and LMS catalogue; approve one versioned offer source |
| Membership term and legacy lifetime rights | Confirm current terms and preserve previously purchased rights; do not rewrite them from a mockup |
| Product links into LMS | Approve stable identifiers, published-product rules, staging URLs and unavailable-product fallback |
| Existing shop transition | Decide reconciliation of purchases, refunds, discounts and customer access before replacing links |
| Shared account experience | Verify each app's auth/session implementation and explicit account binding; do not copy tokens into Welcome |
| Preview isolation | Verify Vercel project/team, branch mapping, public domain and isolated LMS/payment destinations |
| Access and approval ownership | Confirm maintainers' exact GitHub identities and existing access; identify the release approver |

## Proposed work, not live functionality

Course-family comparison, unified LMS checkout, Book/master links, referral rewards,
free Citizen months and cross-app returning-user behavior are proposals or separately
staged work. This branch implements none of those product features. Published
requirements, a UI mockup and functioning server enforcement are separate milestones.

The current `index.html` contains historical marketing claims and contradictory
offer text. This handoff preserves that source for review; it does not validate or
reapprove the claims. Correct content only after a documented owner decision.

# PhuAnh Sneaker Security Specification

## 1. Data Invariants
1. An order cannot exist without valid line items, customer contact, and positive total.
2. An order's items must have concrete size, SKU, and unit price.
3. Inventory changes are tracked via `inventoryMovements`.
4. Role escalation is forbidden: customers cannot elevate themselves to ADMIN. Admin privilege requires existence of record in `/admins/{uid}` or authenticated admin email `imperblorius@gmail.com`.
5. Customer order history is strictly scoped to `userId == request.auth.uid` for authenticated users; guest lookup requires matching orderId + phone number.
6. Public catalog (`products`, `banners`, `storeSettings`, `categories`, `coupons`) is publicly readable; modifications require admin privileges.

## 2. Dirty Dozen Payloads & Test Scenarios
1. **Payload 1 (Self-Assigned Admin Role)**: User creates profile `/users/{uid}` with `role: "ADMIN"`. Rejected: non-admin cannot write role ADMIN.
2. **Payload 2 (Shadow Field Injection)**: User updates `/users/{uid}` with `isSuperAdmin: true`. Rejected: `affectedKeys` does not permit unapproved fields.
3. **Payload 3 (Product Price Tampering)**: Customer attempts to update `/products/{id}` price to `1000`. Rejected: only admin can update products.
4. **Payload 4 (Orphaned Order Creation)**: Attacker submits order with empty items array `[]`. Rejected: items array must be non-empty.
5. **Payload 5 (Negative Quantity Injection)**: Attacker submits line item with `quantity: -5`. Rejected: quantity must be positive integer.
6. **Payload 6 (Other User Order Snooping)**: User B queries `/orders` where `userId == userA`. Rejected: user can only read their own orders.
7. **Payload 7 (Coupons Manipulation)**: Customer tries to update coupon discount to `100%`. Rejected: coupons are read-only for customers.
8. **Payload 8 (Inventory Direct Tampering)**: Customer writes to `/inventoryMovements`. Rejected: inventory records restricted to admin/server.
9. **Payload 9 (ID Poisoning Attack)**: Document ID with special shell characters or length > 128 characters. Rejected: `isValidId` check fails.
10. **Payload 10 (Terminal Order State Override)**: User tries to un-cancel or manipulate completed order. Rejected: terminal state lock.
11. **Payload 11 (Store Settings Defacement)**: Anonymous user updates `/storeSettings/general` hotline or bank info. Rejected: admin only.
12. **Payload 12 (Admin Bypass Spoofing)**: Client provides fake token claim `request.auth.token.role = 'admin'`. Rejected: rules rely on `/admins/{uid}` document verification.
